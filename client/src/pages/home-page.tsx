import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, LogOut, Archive, Settings, User } from "lucide-react";
import WizardForm from "@/components/wizard/wizard-form";
import ArchiveView from "@/components/archive/archive-view";
import AdminPanel from "@/components/admin/admin-panel";
import ProfilePanel from "@/components/profile/profile-panel";

export default function HomePage() {
  const { user, logoutMutation } = useAuth();
  const [activeTab, setActiveTab] = useState("wizard");

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-foreground" data-testid="text-app-title">
                  Adli Bilgi Notu Sistemi
                </h1>
                <p className="text-sm text-muted-foreground">Ankara Cumhuriyet Başsavcılığı</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-foreground" data-testid="text-user-name">
                  {user?.name}
                </p>
                <p className="text-xs text-muted-foreground" data-testid="text-user-title">
                  {user?.title}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                disabled={logoutMutation.isPending}
                data-testid="button-logout"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className={`grid w-full ${user?.isAdmin ? 'grid-cols-4' : 'grid-cols-3'} lg:w-auto`}>
              <TabsTrigger 
                value="wizard" 
                className="flex items-center space-x-2"
                data-testid="tab-wizard"
              >
                <FileText className="w-4 h-4" />
                <span>Yeni Bilgi Notu</span>
              </TabsTrigger>
              <TabsTrigger 
                value="archive" 
                className="flex items-center space-x-2"
                data-testid="tab-archive"
              >
                <Archive className="w-4 h-4" />
                <span>Arşiv</span>
              </TabsTrigger>
              <TabsTrigger 
                value="profile" 
                className="flex items-center space-x-2"
                data-testid="tab-profile"
              >
                <User className="w-4 h-4" />
                <span>Profil</span>
              </TabsTrigger>
              {user?.isAdmin && (
                <TabsTrigger 
                  value="admin" 
                  className="flex items-center space-x-2"
                  data-testid="tab-admin"
                >
                  <Settings className="w-4 h-4" />
                  <span>Yönetim Paneli</span>
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="wizard" className="mt-6">
              <WizardForm />
            </TabsContent>

            <TabsContent value="archive" className="mt-6">
              <ArchiveView />
            </TabsContent>

            <TabsContent value="profile" className="mt-6">
              <ProfilePanel />
            </TabsContent>

            {user?.isAdmin && (
              <TabsContent value="admin" className="mt-6">
                <AdminPanel />
              </TabsContent>
            )}
          </Tabs>
        </div>
      </div>
    </div>
  );
}
