import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Mevcut şifre gereklidir"),
  newPassword: z.string().min(6, "Yeni şifre en az 6 karakter olmalıdır"),
  confirmPassword: z.string().min(1, "Şifre onayı gereklidir"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Şifreler eşleşmiyor",
  path: ["confirmPassword"],
}).refine((data) => data.currentPassword !== data.newPassword, {
  message: "Yeni şifre mevcut şifreden farklı olmalıdır",
  path: ["newPassword"],
});

type ChangePasswordForm = z.infer<typeof changePasswordSchema>;

export default function ProfilePanel() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const form = useForm<ChangePasswordForm>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: async (data: ChangePasswordForm) => {
      return await apiRequest("POST", "/api/user/change-password", {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
    },
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: "Şifreniz başarıyla değiştirildi",
      });
      form.reset();
      setIsChangingPassword(false);
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error?.message || "Şifre değiştirme işleminde hata oluştu",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: ChangePasswordForm) => {
    changePasswordMutation.mutate(data);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Kullanıcı Bilgileri */}
      <Card data-testid="card-user-info">
        <CardHeader>
          <CardTitle>Kullanıcı Bilgileri</CardTitle>
          <CardDescription>Hesap bilgileriniz</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Ad Soyad</label>
              <p className="text-foreground font-medium" data-testid="text-profile-name">
                {user?.name}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Unvan</label>
              <p className="text-foreground font-medium" data-testid="text-profile-title">
                {user?.title}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Sicil No</label>
              <p className="text-foreground font-medium" data-testid="text-profile-registry">
                {user?.registryNumber}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Yetki</label>
              <p className="text-foreground font-medium" data-testid="text-profile-role">
                {user?.isAdmin ? "Yönetici" : "Kullanıcı"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Şifre Değiştirme */}
      <Card data-testid="card-password-change">
        <CardHeader>
          <CardTitle>Güvenlik</CardTitle>
          <CardDescription>Şifrenizi değiştirin</CardDescription>
        </CardHeader>
        <CardContent>
          {!isChangingPassword ? (
            <Button
              onClick={() => setIsChangingPassword(true)}
              data-testid="button-start-password-change"
            >
              Şifre Değiştir
            </Button>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="currentPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mevcut Şifre</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          {...field}
                          data-testid="input-current-password"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Yeni Şifre</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          {...field}
                          data-testid="input-new-password"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Yeni Şifre (Tekrar)</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          {...field}
                          data-testid="input-confirm-password"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex space-x-2">
                  <Button
                    type="submit"
                    disabled={changePasswordMutation.isPending}
                    data-testid="button-submit-password-change"
                  >
                    {changePasswordMutation.isPending ? "Değiştiriliyor..." : "Şifre Değiştir"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsChangingPassword(false);
                      form.reset();
                    }}
                    data-testid="button-cancel-password-change"
                  >
                    İptal
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}