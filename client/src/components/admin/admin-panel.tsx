import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Upload, Users, FileText, Archive, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AdminPanel() {
  const { toast } = useToast();
  const [newTemplate, setNewTemplate] = useState({
    name: "",
    type: "",
    fields: {} as any,
  });

  // Get Users
  const { data: users } = useQuery({
    queryKey: ["/api/users"],
  });

  // Get Templates
  const { data: templates } = useQuery({
    queryKey: ["/api/templates"],
  });

  // Update User Admin Status
  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, isAdmin }: { userId: string; isAdmin: boolean }) => {
      await apiRequest("PATCH", `/api/users/${userId}/admin`, { isAdmin });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Başarılı",
        description: "Kullanıcı yetkisi güncellendi",
      });
    },
    onError: (error) => {
      toast({
        title: "Hata",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete User
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      await apiRequest("DELETE", `/api/users/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Başarılı",
        description: "Kullanıcı silindi",
      });
    },
    onError: (error) => {
      toast({
        title: "Hata",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Create Template
  const createTemplateMutation = useMutation({
    mutationFn: async (template: any) => {
      await apiRequest("POST", "/api/templates", template);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/templates"] });
      setNewTemplate({ name: "", type: "", fields: {} });
      toast({
        title: "Başarılı",
        description: "Şablon oluşturuldu",
      });
    },
    onError: (error) => {
      toast({
        title: "Hata",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete Template
  const deleteTemplateMutation = useMutation({
    mutationFn: async (templateId: string) => {
      await apiRequest("DELETE", `/api/templates/${templateId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/templates"] });
      toast({
        title: "Başarılı",
        description: "Şablon silindi",
      });
    },
    onError: (error) => {
      toast({
        title: "Hata",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCreateTemplate = () => {
    if (!newTemplate.name || !newTemplate.type) {
      toast({
        title: "Hata",
        description: "Şablon adı ve türü gereklidir",
        variant: "destructive",
      });
      return;
    }

    createTemplateMutation.mutate({
      ...newTemplate,
      fields: {
        // Default fields for the template
        subject: { type: "text", label: "Konu", required: true },
        pressStatus: { type: "select", label: "Basına Düşme Durumu", options: ["Düştü", "Düşmedi"] },
        additionalInfo: { type: "textarea", label: "Ek Bilgiler" },
      },
    });
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Management */}
        <div className="lg:col-span-2">
          <Card data-testid="card-user-management">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="w-5 h-5" />
                <span>Kullanıcı Yönetimi</span>
              </CardTitle>
              <CardDescription>
                Sisteme giriş yapabilecek kullanıcıları yönetin.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Bulk Upload */}
              <div className="p-4 bg-muted/50 rounded-md">
                <h3 className="font-medium text-foreground mb-2">Toplu Kullanıcı Yükleme</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  CSV formatında kullanıcı listesini yükleyebilirsiniz. Format: Sicil No, Ad Soyad, Ünvan
                </p>
                <div className="flex items-center space-x-4">
                  <Input
                    type="file"
                    accept=".csv"
                    className="file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                    data-testid="input-bulk-upload"
                  />
                  <Button data-testid="button-bulk-upload">
                    <Upload className="w-4 h-4 mr-2" />
                    Yükle
                  </Button>
                </div>
              </div>

              {/* User List */}
              <Table data-testid="table-users">
                <TableHeader>
                  <TableRow>
                    <TableHead>Sicil No</TableHead>
                    <TableHead>Ad Soyad</TableHead>
                    <TableHead>Ünvan</TableHead>
                    <TableHead>Yetki</TableHead>
                    <TableHead>İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(users as any[])?.map((user: any) => (
                    <TableRow key={user.id} data-testid={`row-user-${user.id}`}>
                      <TableCell>{user.registryNumber}</TableCell>
                      <TableCell>{user.name}</TableCell>
                      <TableCell>{user.title}</TableCell>
                      <TableCell>
                        <Select
                          value={user.isAdmin ? "admin" : "user"}
                          onValueChange={(value) => {
                            updateUserMutation.mutate({
                              userId: user.id,
                              isAdmin: value === "admin",
                            });
                          }}
                        >
                          <SelectTrigger className="w-32" data-testid={`select-role-${user.id}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="user">Kullanıcı</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteUserMutation.mutate(user.id)}
                          data-testid={`button-delete-user-${user.id}`}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Template Management */}
        <div>
          <Card data-testid="card-template-management">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="w-5 h-5" />
                <span>Şablon Yönetimi</span>
              </CardTitle>
              <CardDescription>
                Bilgi notu şablonlarını yönetin.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Create New Template */}
              <div className="p-4 bg-muted/50 rounded-md">
                <h3 className="font-medium text-foreground mb-4">Yeni Şablon Oluştur</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="templateName">Şablon Adı</Label>
                    <Input
                      id="templateName"
                      placeholder="Şablon adı"
                      value={newTemplate.name}
                      onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                      data-testid="input-template-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="templateType">Şablon Türü</Label>
                    <Select
                      value={newTemplate.type}
                      onValueChange={(value) => setNewTemplate({ ...newTemplate, type: value })}
                    >
                      <SelectTrigger data-testid="select-template-type">
                        <SelectValue placeholder="Tür seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="violence">Kadına ve Çocuğa Şiddet</SelectItem>
                        <SelectItem value="sexual">Cinsel Saldırı/İstismar</SelectItem>
                        <SelectItem value="victim-status">Mağdurun Vasıf Sebebiyle</SelectItem>
                        <SelectItem value="suspect-status">Şüphelinin Vasıf Sebebiyle</SelectItem>
                        <SelectItem value="legal-personnel">Hâkim-Savcı-Avukat</SelectItem>
                        <SelectItem value="organized-crime">Organize Suç</SelectItem>
                        <SelectItem value="public-order">Kamu Düzeni</SelectItem>
                        <SelectItem value="accidents">Patlama, Doğal Olay</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    onClick={handleCreateTemplate}
                    disabled={createTemplateMutation.isPending}
                    className="w-full"
                    data-testid="button-create-template"
                  >
                    Şablonu Oluştur
                  </Button>
                </div>
              </div>

              {/* Current Templates */}
              <div>
                <h3 className="font-medium text-foreground mb-4">Mevcut Şablonlar</h3>
                <div className="space-y-2">
                  {(templates as any[])?.map((template: any) => (
                    <div
                      key={template.id}
                      className="flex justify-between items-center p-3 border border-border rounded-md"
                      data-testid={`template-item-${template.id}`}
                    >
                      <div>
                        <p className="text-sm font-medium text-foreground">{template.name}</p>
                        <p className="text-xs text-muted-foreground">
                          v{template.version} - {new Date(template.createdAt).toLocaleDateString("tr-TR")}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteTemplateMutation.mutate(template.id)}
                        data-testid={`button-delete-template-${template.id}`}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* System Statistics */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card data-testid="card-stat-users">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                <Users className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Toplam Kullanıcı</p>
                <p className="text-lg font-semibold text-foreground">{(users as any[])?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-stat-notes">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-accent/10 rounded-lg flex items-center justify-center">
                <FileText className="w-4 h-4 text-accent-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Bu Ay Oluşturulan</p>
                <p className="text-lg font-semibold text-foreground">-</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-stat-archive">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-secondary/10 rounded-lg flex items-center justify-center">
                <Archive className="w-4 h-4 text-secondary-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Toplam Arşiv</p>
                <p className="text-lg font-semibold text-foreground">-</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-stat-templates">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-muted/10 rounded-lg flex items-center justify-center">
                <FileText className="w-4 h-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Aktif Şablon</p>
                <p className="text-lg font-semibold text-foreground">{(templates as any[])?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
