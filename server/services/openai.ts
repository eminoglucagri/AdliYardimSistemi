import OpenAI from "openai";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key"
});

export interface AIAnalysisResult {
  eventDate?: string;
  suspect?: string;
  victim?: string;
  crimeType?: string;
  location?: string;
  summary?: string;
  suggestedFormat?: string;
  extractedFields?: Record<string, any>;
}

export async function analyzePoliceReport(text: string): Promise<AIAnalysisResult> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Daha hızlı model
      messages: [
        {
          role: "system",
          content: `Sen Türk adli sisteminde uzman bir asistansın. Emniyet bilgi notlarını analiz et.
          
          Formatlardan birini seç:
          - violence: Kadına/Çocuğa Şiddet
          - sexual: Cinsel Saldırı
          - victim-status: Mağdur Vasıf
          - suspect-status: Şüpheli Vasıf
          - legal-personnel: Hâkim-Savcı-Avukat
          - organized-crime: Organize Suç
          - public-order: Kamu Düzeni
          - accidents: Kaza/Patlama
          
          Aşağıdaki alanları çıkar (varsa):
          - eventDate: Olay tarihi (DD.MM.YYYY formatında)
          - eventDateTime: Olay tarih ve saati 
          - suspect: Şüpheli bilgisi (ad, yaş, meslek vb.)
          - victim: Mağdur bilgisi (ad, yaş, meslek vb.)
          - crimeType: Suç türü
          - location: Olay yeri
          - summary: Olay özeti
          - method: Eylem şekli
          - maritalStatus: Medeni durum
          - injuryType: Yaralanma türü
          - measures: Alınan tedbirler
          - pressStatus: Basına yansıma durumu (dustu/dusmedi)
          - suggestedFormat: Önerilen format (yukarıdakilerden biri)
          
          Sadece metinde açıkça belirtilen bilgileri çıkar.
          JSON formatında yanıt ver.`
        },
        {
          role: "user",
          content: `Analiz et: ${text.substring(0, 3000)}` // Metin uzunluğunu sınırla
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3, // Daha tutarlı sonuçlar için
      max_tokens: 1000, // Token limiti
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    // Basit alan eşlemesi yap
    const extractedFields: Record<string, any> = {};
    
    // Temel alanları direkt aktar
    if (result.eventDate) extractedFields.eventDate = result.eventDate;
    if (result.eventDateTime) extractedFields.eventDateTime = result.eventDateTime;
    if (result.suspect) extractedFields.suspectInfo = result.suspect;
    if (result.victim) extractedFields.victimInfo = result.victim;
    if (result.crimeType) extractedFields.crimeType = result.crimeType;
    if (result.location) extractedFields.eventLocation = result.location;
    if (result.summary) extractedFields.eventSummary = result.summary;
    if (result.method) extractedFields.eventMethod = result.method;
    if (result.maritalStatus) extractedFields.maritalStatus = result.maritalStatus;
    if (result.injuryType) extractedFields.injuryType = result.injuryType;
    if (result.measures) extractedFields.suspectMeasures = result.measures;
    if (result.pressStatus) extractedFields.pressStatus = result.pressStatus;
    
    // Konu başlığını format tipine göre ayarla
    const formatNames: Record<string, string> = {
      'violence': 'Kadına ve Çocuğa Şiddet',
      'sexual': 'Cinsel Saldırı / İstismar',
      'victim-status': 'Mağdurun Vasıf Sebebiyle Önem Arz Eden Olaylar',
      'suspect-status': 'Şüphelinin Vasıf Sebebiyle Önem Arz Eden Olaylar',
      'legal-personnel': 'Hâkim - Savcı - Avukat Olayları',
      'organized-crime': 'Organize Suç Örgütü',
      'public-order': 'Kamu Düzenine Karşı İşlenen Suçlar',
      'accidents': 'Patlama, Doğal Olay, Kazalar'
    };
    
    if (result.suggestedFormat && formatNames[result.suggestedFormat]) {
      extractedFields.subject = formatNames[result.suggestedFormat];
    }
    
    // Basın durumu default
    if (!extractedFields.pressStatus) {
      extractedFields.pressStatus = 'dustu';
    }
    
    return {
      eventDate: result.eventDate,
      suspect: result.suspect,
      victim: result.victim,
      crimeType: result.crimeType,
      location: result.location,
      summary: result.summary,
      suggestedFormat: result.suggestedFormat,
      extractedFields: { ...extractedFields, ...result.extractedFields },
    };
  } catch (error) {
    console.error("AI analysis failed:", error);
    throw new Error("AI analizi sırasında hata oluştu");
  }
}

function replacePlaceholder(template: string, key: string, value: any): string {
  // Basit placeholder değişimi
  const simpleRegex = new RegExp('{{' + key + '}}', 'g');
  template = template.replace(simpleRegex, String(value || ''));
  
  // Koşullu bölümler için
  if (value !== null && value !== undefined && value !== '') {
    // Değer varsa içeriği göster
    const ifStartRegex = new RegExp('{{#if ' + key + '}}', 'g');
    const ifEndRegex = new RegExp('{{/if}}', 'g');
    
    // İlk önce başlangıç tag'ini işaretle
    template = template.replace(ifStartRegex, '__IF_START__');
    
    // İlgili bitiş tag'ini bul ve işaretle  
    let depth = 0;
    let result = '';
    let inCondition = false;
    let conditionContent = '';
    
    for (let i = 0; i < template.length; i++) {
      if (template.substring(i, i + 12) === '__IF_START__') {
        inCondition = true;
        depth = 1;
        i += 11; // Skip the marker
      } else if (inCondition && template.substring(i, i + 7) === '{{#if ') {
        depth++;
        conditionContent += template[i];
      } else if (inCondition && template.substring(i, i + 7) === '{{/if}}') {
        depth--;
        if (depth === 0) {
          result += conditionContent;
          inCondition = false;
          conditionContent = '';
          i += 6; // Skip {{/if}}
        } else {
          conditionContent += template[i];
        }
      } else if (inCondition) {
        conditionContent += template[i];
      } else {
        result += template[i];
      }
    }
    
    template = result || template.replace(/__IF_START__/g, '{{#if ' + key + '}}');
  } else {
    // Değer yoksa tüm koşullu bölümü kaldır
    const pattern = '{{#if ' + key + '}}.*?{{/if}}';
    const removeRegex = new RegExp(pattern, 'gs');
    template = template.replace(removeRegex, '');
  }
  
  return template;
}

export async function generateJudicialDocument(
  template: any,
  formData: Record<string, any>,
  aiAnalysis: AIAnalysisResult
): Promise<string> {
  try {
    // Şablon içeriğini al
    let documentContent = template.templateContent || "";
    
    // Eğer şablon içeriği yoksa eski yöntemle oluştur
    if (!documentContent) {
      const response = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [
          {
            role: "system",
            content: `Sen Türk adli sisteminde resmi belge formatında bilgi notu hazırlayan bir asistansın. 
            Verilen form verileri ve AI analizine göre resmi adli bilgi notu oluştur. 
            Türkçe, resmi dil kullan ve hukuki format kurallarına uy.`
          },
          {
            role: "user",
            content: `Form Verileri: ${JSON.stringify(formData)}
            AI Analizi: ${JSON.stringify(aiAnalysis)}
            
            Bu bilgilere göre resmi adli bilgi notu oluştur.`
          }
        ],
      });
      return response.choices[0].message.content || "";
    }
    
    // Form verilerini ve AI analizini birleştir
    const allData = { ...formData, ...aiAnalysis.extractedFields };
    
    // Her bir veri için placeholder'ları değiştir
    for (const [key, value] of Object.entries(allData)) {
      documentContent = replacePlaceholder(documentContent, key, value);
    }
    
    // Kalan tüm placeholder'ları temizle
    documentContent = documentContent.replace(/{{[^}]+}}/g, "");
    documentContent = documentContent.replace(/{{#if [^}]+}}[\s\S]*?{{\/if}}/g, "");
    
    return documentContent;
  } catch (error) {
    console.error("Document generation failed:", error);
    throw new Error("Belge oluşturma sırasında hata oluştu");
  }
}