import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Loader2 } from "lucide-react";

export default function AuthPage() {
  const { user, loginMutation } = useAuth();
  const [, setLocation] = useLocation();
  
  const [loginData, setLoginData] = useState({
    registryNumber: "",
    password: "",
  });
  

  // Redirect if already logged in
  if (user) {
    setLocation("/");
    return null;
  }

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate(loginData);
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md mx-auto">
          {/* Logo & Header */}
          <div className="text-center mb-8">
            <div className="mx-auto w-20 h-20 bg-primary rounded-full flex items-center justify-center mb-4">
              <FileText className="w-10 h-10 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Adli Bilgi Notu Sistemi</h1>
            <p className="text-muted-foreground mt-2">Ankara Cumhuriyet Başsavcılığı</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Sisteme Giriş</CardTitle>
              <CardDescription>
                Sicil numaranızla sisteme giriş yapın
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="loginRegistry">Sicil Numarası</Label>
                  <Input
                    id="loginRegistry"
                    type="text"
                    placeholder="Sicil numaranızı giriniz"
                    value={loginData.registryNumber}
                    onChange={(e) => setLoginData({ ...loginData, registryNumber: e.target.value })}
                    required
                    data-testid="input-registry-login"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="loginPassword">Şifre</Label>
                  <Input
                    id="loginPassword"
                    type="password"
                    placeholder="Şifrenizi giriniz"
                    value={loginData.password}
                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                    required
                    data-testid="input-password-login"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={loginMutation.isPending}
                  data-testid="button-login"
                >
                  {loginMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Giriş yapılıyor...
                    </>
                  ) : (
                    "Giriş Yap"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
          
          <div className="mt-6 text-center text-sm text-muted-foreground">
            Güvenli giriş sistemi - Sadece yetkili personel
          </div>
      </div>
    </div>
  );
}
