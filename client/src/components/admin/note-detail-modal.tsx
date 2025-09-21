import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calendar, User2, FileText, Tag, Brain, Clock } from "lucide-react";

interface NoteDetailModalProps {
  note: any;
  isOpen: boolean;
  onClose: () => void;
}

export default function NoteDetailModal({ note, isOpen, onClose }: NoteDetailModalProps) {
  if (!note) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("tr-TR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" data-testid="modal-note-detail">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <FileText className="w-5 h-5" />
            <span>Bilgi Notu Detayları</span>
          </DialogTitle>
          <DialogDescription>
            {note.user?.name} tarafından {formatDate(note.createdAt)} tarihinde oluşturuldu
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Temel Bilgiler */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <User2 className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Oluşturan</span>
              </div>
              <div className="pl-6">
                <p className="font-medium" data-testid="text-note-user-name">{note.user?.name}</p>
                <p className="text-sm text-muted-foreground">{note.user?.title}</p>
                <p className="text-sm text-muted-foreground">Sicil No: {note.user?.registryNumber}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Tarih Bilgileri</span>
              </div>
              <div className="pl-6">
                <p className="text-sm">
                  <Clock className="w-3 h-3 inline mr-1" />
                  Oluşturulma: {formatDate(note.createdAt)}
                </p>
                {note.updatedAt !== note.createdAt && (
                  <p className="text-sm text-muted-foreground">
                    Son güncelleme: {formatDate(note.updatedAt)}
                  </p>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Şablon Bilgileri */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Tag className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Şablon Bilgileri</span>
            </div>
            <div className="pl-6">
              <div className="flex items-center space-x-2">
                <Badge variant="secondary" data-testid="badge-template-name">
                  {note.template?.name || "Bilinmeyen Şablon"}
                </Badge>
                {note.template?.version && (
                  <Badge variant="outline">v{note.template.version}</Badge>
                )}
              </div>
              {note.template?.description && (
                <p className="text-sm text-muted-foreground mt-2">
                  {note.template.description}
                </p>
              )}
            </div>
          </div>

          <Separator />

          {/* Konu */}
          {note.subject && (
            <>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Konu</span>
                </div>
                <div className="pl-6">
                  <p className="text-foreground" data-testid="text-note-subject">
                    {note.subject}
                  </p>
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Orijinal Metin */}
          {note.originalText && (
            <>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Orijinal Polis Bilgi Notu</span>
                </div>
                <div className="pl-6">
                  <div className="bg-muted/30 p-4 rounded-lg" data-testid="text-original-text">
                    <pre className="whitespace-pre-wrap text-sm text-foreground font-mono">
                      {note.originalText}
                    </pre>
                  </div>
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* AI Analiz Sonuçları */}
          {note.aiAnalysis && (
            <>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Brain className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">AI Analiz Sonuçları</span>
                </div>
                <div className="pl-6">
                  <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg" data-testid="text-ai-analysis">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(note.aiAnalysis).map(([key, value]) => (
                        <div key={key} className="space-y-1">
                          <p className="text-xs font-medium text-blue-700 dark:text-blue-300 capitalize">
                            {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                          </p>
                          <p className="text-sm text-blue-900 dark:text-blue-100">
                            {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Form Verileri */}
          {note.formData && Object.keys(note.formData).length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Form Verileri</span>
              </div>
              <div className="pl-6">
                <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg" data-testid="text-form-data">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(note.formData).map(([key, value]) => (
                      <div key={key} className="space-y-1">
                        <p className="text-xs font-medium text-green-700 dark:text-green-300 capitalize">
                          {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                        </p>
                        <p className="text-sm text-green-900 dark:text-green-100">
                          {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Belge ID */}
          <div className="pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Belge ID: <span className="font-mono">{note.id}</span>
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}