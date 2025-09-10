import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Loader2 } from "lucide-react";

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  const [, setLocation] = useLocation();
  
  const [loginData, setLoginData] = useState({
    registryNumber: "",
    password: "",
  });
  
  const [registerData, setRegisterData] = useState({
    registryNumber: "",
    name: "",
    title: "",
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

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    registerMutation.mutate(registerData);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        {/* Left Side - Auth Forms */}
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
                Sicil numaranızla giriş yapın veya yeni hesap oluşturun
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="login" className="space-y-4">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="login">Giriş Yap</TabsTrigger>
                  <TabsTrigger value="register">Kayıt Ol</TabsTrigger>
                </TabsList>
                
                <TabsContent value="login">
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
                </TabsContent>
                
                <TabsContent value="register">
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="registerRegistry">Sicil Numarası</Label>
                      <Input
                        id="registerRegistry"
                        type="text"
                        placeholder="Sicil numaranızı giriniz"
                        value={registerData.registryNumber}
                        onChange={(e) => setRegisterData({ ...registerData, registryNumber: e.target.value })}
                        required
                        data-testid="input-registry-register"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="registerName">Ad Soyad</Label>
                      <Input
                        id="registerName"
                        type="text"
                        placeholder="Adınızı ve soyadınızı giriniz"
                        value={registerData.name}
                        onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                        required
                        data-testid="input-name-register"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="registerTitle">Ünvan</Label>
                      <Input
                        id="registerTitle"
                        type="text"
                        placeholder="Ünvanınızı giriniz"
                        value={registerData.title}
                        onChange={(e) => setRegisterData({ ...registerData, title: e.target.value })}
                        required
                        data-testid="input-title-register"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="registerPassword">Şifre</Label>
                      <Input
                        id="registerPassword"
                        type="password"
                        placeholder="Şifrenizi giriniz"
                        value={registerData.password}
                        onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                        required
                        data-testid="input-password-register"
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={registerMutation.isPending}
                      data-testid="button-register"
                    >
                      {registerMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Kayıt olunuyor...
                        </>
                      ) : (
                        "Kayıt Ol"
                      )}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
          
          <div className="mt-6 text-center text-sm text-muted-foreground">
            Güvenli giriş sistemi - Sadece yetkili personel
          </div>
        </div>

        {/* Right Side - Hero Section */}
        <div className="hidden lg:block">
          <div className="text-center space-y-6">
            <div className="w-32 h-32 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
              <FileText className="w-16 h-16 text-primary" />
            </div>
            <div className="space-y-4">
              <h2 className="text-3xl font-bold text-gray-900">
                Emniyet Bilgi Notlarını
                <br />
                Adli Formata Dönüştürün
              </h2>
              <p className="text-lg text-muted-foreground max-w-md mx-auto">
                Yapay zeka destekli sistem ile emniyet bilgi notlarınızı
                hızlı ve doğru şekilde adli formata dönüştürün.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto text-sm">
              <div className="bg-white/50 rounded-lg p-4">
                <div className="font-semibold">8 Farklı Format</div>
                <div className="text-muted-foreground">Şiddet, İstismar, vb.</div>
              </div>
              <div className="bg-white/50 rounded-lg p-4">
                <div className="font-semibold">AI Analizi</div>
                <div className="text-muted-foreground">Otomatik veri çıkarma</div>
              </div>
              <div className="bg-white/50 rounded-lg p-4">
                <div className="font-semibold">Çoklu Export</div>
                <div className="text-muted-foreground">Word, PDF, Text</div>
              </div>
              <div className="bg-white/50 rounded-lg p-4">
                <div className="font-semibold">Güvenli Arşiv</div>
                <div className="text-muted-foreground">Arama ve filtreleme</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
