import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, FileText, Download, Copy, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AIAnalysisResult {
  eventDate?: string;
  suspect?: string;
  victim?: string;
  crimeType?: string;
  location?: string;
  summary?: string;
  suggestedFormat?: string;
  extractedFields?: Record<string, any>;
}

const formatOptions = [
  { id: "violence", name: "Kadına ve Çocuğa Şiddet", icon: "👥" },
  { id: "sexual", name: "Cinsel Saldırı / İstismar", icon: "⚠️" },
  { id: "victim-status", name: "Mağdurun Vasıf Sebebiyle Önem Arz Eden Olaylar", icon: "👤" },
  { id: "suspect-status", name: "Şüphelinin Vasıf Sebebiyle Önem Arz Eden Olaylar", icon: "👮" },
  { id: "legal-personnel", name: "Hâkim - Savcı - Avukat Olayları", icon: "⚖️" },
  { id: "organized-crime", name: "Organize Suç Örgütü", icon: "🏢" },
  { id: "public-order", name: "Kamu Düzenine Karşı İşlenen Suçlar", icon: "🛡️" },
  { id: "accidents", name: "Patlama, Doğal Olay, Kazalar", icon: "💥" },
];

export default function WizardForm() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [originalText, setOriginalText] = useState("");
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysisResult | null>(null);
  const [selectedFormat, setSelectedFormat] = useState("");
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [generatedNote, setGeneratedNote] = useState<any>(null);

  // AI Analysis Mutation
  const analyzeMutation = useMutation({
    mutationFn: async (text: string) => {
      const res = await apiRequest("POST", "/api/analyze-text", { text });
      return res.json();
    },
    onSuccess: (analysis: AIAnalysisResult) => {
      setAiAnalysis(analysis);
      setCurrentStep(2);
    },
    onError: (error) => {
      toast({
        title: "Analiz hatası",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Get Templates
  const { data: templates } = useQuery<any[]>({
    queryKey: ["/api/templates"],
    enabled: currentStep >= 3,
  });

  // Create Information Note Mutation
  const createNoteMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/information-notes", data);
      return res.json();
    },
    onSuccess: (note) => {
      setGeneratedNote(note);
      setCurrentStep(5);
      queryClient.invalidateQueries({ queryKey: ["/api/information-notes"] });
    },
    onError: (error) => {
      toast({
        title: "Belge oluşturma hatası",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleAnalyze = () => {
    if (!originalText.trim()) {
      toast({
        title: "Hata",
        description: "Lütfen emniyet bilgi notunu giriniz",
        variant: "destructive",
      });
      return;
    }
    analyzeMutation.mutate(originalText);
  };

  const handleFormatSelect = (formatId: string) => {
    setSelectedFormat(formatId);
    
    // Format seçildiğinde AI verilerini forma aktar
    if (currentStep === 3) {
      setCurrentStep(4);
      
      // AI analizinden gelen verileri forma aktar
      if (aiAnalysis?.extractedFields) {
        const fields = aiAnalysis.extractedFields;
        
        // Format adını konu başlığı olarak ayarla
        const format = formatOptions.find(f => f.id === formatId);
        
        // AI verilerini tamamen string formatında forma aktar
        const extractedData: Record<string, string> = {};
        
        // Format adını konu olarak ayarla
        extractedData.subject = format?.name || '';
        
        // Tüm AI verilerini string'e çevir
        const convertToString = (value: any): string => {
          if (value === null || value === undefined) return '';
          if (typeof value === 'string') return value;
          if (typeof value === 'object') return JSON.stringify(value);
          return String(value);
        };
        
        // Ana alanları manuel olarak ayarla
        extractedData.pressStatus = convertToString(fields.pressStatus || 'dustu');
        extractedData.eventDate = convertToString(fields.eventDate);
        extractedData.eventDateTime = convertToString(fields.eventDateTime);
        extractedData.victimInfo = convertToString(fields.victimInfo || fields.victim);
        extractedData.maritalStatus = convertToString(fields.maritalStatus);
        extractedData.suspectInfo = convertToString(fields.suspectInfo || fields.suspect);
        extractedData.crimeType = convertToString(fields.crimeType);
        extractedData.eventLocation = convertToString(fields.eventLocation || fields.location);
        extractedData.eventMethod = convertToString(fields.eventMethod || fields.method);
        extractedData.eventSummary = convertToString(fields.eventSummary || fields.summary);
        extractedData.injuryType = convertToString(fields.injuryType);
        extractedData.autopsyFindings = convertToString(fields.autopsyFindings);
        extractedData.suspectMeasures = convertToString(fields.suspectMeasures || fields.measures);
        extractedData.protectiveMeasures = convertToString(fields.protectiveMeasures || fields.measures);
        
        // Diğer tüm alanları da string olarak ekle
        Object.keys(fields).forEach(key => {
          if (!extractedData.hasOwnProperty(key)) {
            extractedData[key] = convertToString(fields[key]);
          }
        });
        
        console.log('AI\'dan gelen veriler:', JSON.stringify(fields, null, 2));
        console.log('Forma aktarılan veriler:', JSON.stringify(extractedData, null, 2));
        
        setFormData(extractedData);
      }
    }
  };

  const handleGenerateDocument = () => {
    if (!selectedFormat) {
      toast({
        title: "Hata",
        description: "Lütfen bir format seçiniz",
        variant: "destructive",
      });
      return;
    }

    const selectedTemplate = (templates as any[])?.find((t: any) => t.type === selectedFormat);
    if (!selectedTemplate) {
      toast({
        title: "Hata",
        description: "Seçilen format için şablon bulunamadı",
        variant: "destructive",
      });
      return;
    }

    createNoteMutation.mutate({
      templateId: selectedTemplate.id,
      originalText,
      aiAnalysis,
      formData,
    });
  };

  const downloadWord = async () => {
    if (!generatedNote) return;
    
    try {
      const res = await fetch(`/api/generate-word/${generatedNote.id}`, {
        credentials: "include",
      });
      
      if (!res.ok) throw new Error("İndirme hatası");
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `bilgi-notu-${generatedNote.id}.docx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      toast({
        title: "İndirme hatası",
        description: "Word dosyası indirilemedi",
        variant: "destructive",
      });
    }
  };

  const copyToClipboard = () => {
    if (!generatedNote) return;
    
    navigator.clipboard.writeText(generatedNote.generatedDocument).then(() => {
      toast({
        title: "Kopyalandı",
        description: "Bilgi notu panoya kopyalandı",
      });
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Step 1: Text Input */}
      {currentStep === 1 && (
        <Card data-testid="card-step1">
          <CardHeader>
            <CardTitle>Adım 1: Emniyet Bilgi Notu</CardTitle>
            <CardDescription>
              Emniyetten gelen bilgi notunu aşağıdaki alana yapıştırınız.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="originalNote">Emniyet Bilgi Notu İçeriği</Label>
              <Textarea
                id="originalNote"
                className="min-h-64 resize-none"
                placeholder="Emniyet bilgi notunu buraya yapıştırınız..."
                value={originalText}
                onChange={(e) => setOriginalText(e.target.value)}
                data-testid="textarea-original-note"
              />
            </div>
            
            <div className="flex justify-between items-center">
              <div className="text-sm text-muted-foreground">
                {originalText.length} karakter
              </div>
              <Button
                onClick={handleAnalyze}
                disabled={analyzeMutation.isPending || !originalText.trim()}
                data-testid="button-analyze"
              >
                {analyzeMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analiz ediliyor...
                  </>
                ) : (
                  "Analiz Et ve İlerle"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: AI Analysis Results */}
      {currentStep === 2 && aiAnalysis && (
        <Card data-testid="card-step2">
          <CardHeader>
            <CardTitle>Adım 2: AI Analiz Sonuçları</CardTitle>
            <CardDescription>
              AI tarafından çıkarılan bilgiler aşağıda görüntülenmektedir.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-muted/50 p-4 rounded-md">
                <h3 className="font-medium text-foreground mb-2">Tespit Edilen Bilgiler</h3>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {aiAnalysis.eventDate && (
                    <li>• Olay Tarihi: <span className="text-foreground">{String(aiAnalysis.eventDate)}</span></li>
                  )}
                  {aiAnalysis.suspect && (
                    <li>• Şüpheli: <span className="text-foreground">
                      {typeof aiAnalysis.suspect === 'object' ? 
                        `${aiAnalysis.suspect.name || 'Bilinmiyor'} (${aiAnalysis.suspect.age || ''} yaş${aiAnalysis.suspect.profession ? ', ' + aiAnalysis.suspect.profession : ''})` 
                        : String(aiAnalysis.suspect)}
                    </span></li>
                  )}
                  {aiAnalysis.victim && (
                    <li>• Mağdur: <span className="text-foreground">
                      {typeof aiAnalysis.victim === 'object' ? 
                        `${aiAnalysis.victim.name || 'Bilinmiyor'} (${aiAnalysis.victim.age || ''} yaş${aiAnalysis.victim.profession ? ', ' + aiAnalysis.victim.profession : ''})` 
                        : String(aiAnalysis.victim)}
                    </span></li>
                  )}
                  {aiAnalysis.crimeType && (
                    <li>• Suç Türü: <span className="text-foreground">{String(aiAnalysis.crimeType)}</span></li>
                  )}
                  {aiAnalysis.location && (
                    <li>• Yer: <span className="text-foreground">{String(aiAnalysis.location)}</span></li>
                  )}
                  {aiAnalysis.summary && (
                    <li>• Özet: <span className="text-foreground">{String(aiAnalysis.summary).substring(0, 100)}...</span></li>
                  )}
                </ul>
              </div>
              <div className="bg-accent/50 p-4 rounded-md">
                <h3 className="font-medium text-foreground mb-2">Önerilen Format</h3>
                <p className="text-sm text-muted-foreground">
                  {aiAnalysis.suggestedFormat ? (
                    <>
                      AI analizi sonucunda <strong>{formatOptions.find(f => f.id === aiAnalysis.suggestedFormat)?.name}</strong> formatı önerilmektedir.
                    </>
                  ) : (
                    "Format önerisi belirlenemedi. Manuel seçim yapınız."
                  )}
                </p>
              </div>
            </div>
            
            <div className="flex justify-between pt-4">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(1)}
                data-testid="button-back-to-step1"
              >
                Geri
              </Button>
              <Button
                onClick={() => setCurrentStep(3)}
                data-testid="button-to-step3"
              >
                Format Seçimine Geç
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Format Selection */}
      {currentStep === 3 && (
        <Card data-testid="card-step3">
          <CardHeader>
            <CardTitle>Adım 3: Bilgi Notu Formatı Seçimi</CardTitle>
            <CardDescription>
              Hangi formatta bilgi notu hazırlamak istediğinizi seçiniz.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {formatOptions.map((format) => (
                <div
                  key={format.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedFormat === format.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary"
                  }`}
                  onClick={() => setSelectedFormat(format.id)}
                  data-testid={`format-option-${format.id}`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="text-2xl">{format.icon}</div>
                    <div>
                      <h3 className="font-medium text-foreground">{format.name}</h3>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(2)}
                data-testid="button-back-to-step2"
              >
                Geri
              </Button>
              <Button
                onClick={() => handleFormatSelect(selectedFormat)}
                disabled={!selectedFormat}
                data-testid="button-to-step4"
              >
                Seçilen Formatla İlerle
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Form Completion */}
      {currentStep === 4 && (
        <Card data-testid="card-step4">
          <CardHeader>
            <CardTitle>Adım 4: Eksik Bilgilerin Tamamlanması</CardTitle>
            <CardDescription>
              Seçilen format için gerekli ancak emniyet notunda bulunmayan bilgileri tamamlayınız.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-accent/50 p-4 rounded-md">
              <h3 className="font-medium text-foreground mb-2">
                Seçilen Format: {formatOptions.find(f => f.id === selectedFormat)?.name}
              </h3>
              <p className="text-sm text-muted-foreground">
                Aşağıdaki alanları gerektiği şekilde doldurun.
              </p>
            </div>

            {/* Dynamic form fields based on selected template */}
            {templates && selectedFormat && (() => {
              const selectedTemplate = templates.find((t: any) => t.type === selectedFormat);
              if (!selectedTemplate) return null;
              
              const fields = selectedTemplate.fields as Record<string, any>;
              const fieldEntries = Object.entries(fields);
              
              return (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {fieldEntries.map(([key, field]: [string, any]) => {
                      if (field.type === 'textarea') return null; // Render textareas separately
                      
                      return (
                        <div key={key} className="space-y-2">
                          <Label htmlFor={key}>
                            {field.label}
                            {field.required && <span className="text-red-500 ml-1">*</span>}
                          </Label>
                          
                          {field.type === 'text' && (
                            <Input
                              id={key}
                              placeholder={field.label}
                              value={formData[key] || ""}
                              onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
                              required={field.required}
                              data-testid={`input-${key}`}
                            />
                          )}
                          
                          {field.type === 'date' && (
                            <Input
                              id={key}
                              type="date"
                              value={formData[key] || ""}
                              onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
                              required={field.required}
                              data-testid={`input-${key}`}
                            />
                          )}
                          
                          {field.type === 'datetime' && (
                            <Input
                              id={key}
                              type="datetime-local"
                              value={formData[key] || ""}
                              onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
                              required={field.required}
                              data-testid={`input-${key}`}
                            />
                          )}
                          
                          {field.type === 'select' && (
                            <Select
                              value={formData[key] || ""}
                              onValueChange={(value) => setFormData({ ...formData, [key]: value })}
                            >
                              <SelectTrigger data-testid={`select-${key}`}>
                                <SelectValue placeholder="Seçiniz" />
                              </SelectTrigger>
                              <SelectContent>
                                {field.options?.map((option: string) => (
                                  <SelectItem key={option} value={option.toLowerCase().replace(/\s+/g, '')}>
                                    {option}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Render all textarea fields */}
                  <div className="space-y-4">
                    {fieldEntries.filter(([_, field]) => field.type === 'textarea').map(([key, field]: [string, any]) => (
                      <div key={key} className="space-y-2">
                        <Label htmlFor={key}>
                          {field.label}
                          {field.required && <span className="text-red-500 ml-1">*</span>}
                        </Label>
                        <Textarea
                          id={key}
                          className="min-h-24 resize-none"
                          placeholder={field.label}
                          value={formData[key] || ""}
                          onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
                          required={field.required}
                          data-testid={`textarea-${key}`}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(3)}
                data-testid="button-back-to-step3"
              >
                Geri
              </Button>
              <Button
                onClick={handleGenerateDocument}
                disabled={createNoteMutation.isPending}
                data-testid="button-generate-document"
              >
                {createNoteMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Oluşturuluyor...
                  </>
                ) : (
                  "Bilgi Notu Oluştur"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 5: Document Generation */}
      {currentStep === 5 && generatedNote && (
        <Card data-testid="card-step5">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span>Bilgi Notu Oluşturuldu</span>
            </CardTitle>
            <CardDescription>
              Bilgi notunuz başarıyla oluşturuldu. Aşağıdan indirebilir veya kopyalayabilirsiniz.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Document Preview */}
            <div className="bg-muted/50 p-6 rounded-md max-h-96 overflow-y-auto">
              <div className="bg-white p-6 shadow-sm rounded">
                <div className="whitespace-pre-wrap text-sm" data-testid="text-document-preview">
                  {generatedNote.generatedDocument}
                </div>
              </div>
            </div>

            {/* Download Options */}
            <div className="flex flex-wrap gap-4">
              <Button
                onClick={downloadWord}
                className="flex items-center space-x-2"
                data-testid="button-download-word"
              >
                <Download className="w-4 h-4" />
                <span>Word İndir</span>
              </Button>
              
              <Button
                onClick={copyToClipboard}
                variant="outline"
                className="flex items-center space-x-2"
                data-testid="button-copy-text"
              >
                <Copy className="w-4 h-4" />
                <span>Metni Kopyala</span>
              </Button>
            </div>

            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(4)}
                data-testid="button-back-to-step4"
              >
                Düzenle
              </Button>
              <Button
                onClick={() => {
                  setCurrentStep(1);
                  setOriginalText("");
                  setAiAnalysis(null);
                  setSelectedFormat("");
                  setFormData({});
                  setGeneratedNote(null);
                }}
                data-testid="button-start-new"
              >
                Yeni Bilgi Notu Başlat
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
