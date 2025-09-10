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
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: `Sen Türk adli sisteminde uzman bir yapay zeka asistanısın. Emniyet bilgi notlarını analiz ederek önemli bilgileri çıkarıyorsun.
          
          Aşağıdaki formatlardan hangisinin uygun olduğunu belirle:
          - violence: Kadına ve Çocuğa Şiddet (aile içi şiddet, çocuk istismarı)
          - sexual: Cinsel Saldırı/İstismar
          - victim-status: Mağdurun Vasıf Sebebiyle Önem Arz Eden Olaylar (devlet görevlisi, tanınmış kişiler)
          - suspect-status: Şüphelinin Vasıf Sebebiyle Önem Arz Eden Olaylar (devlet görevlisi, tanınmış kişiler)
          - legal-personnel: Hâkim-Savcı-Avukat Olayları
          - organized-crime: Organize Suç Örgütü veya Ekonomik Suçlar
          - public-order: Kamu Düzenine Karşı İşlenen Suçlar
          - accidents: Patlama, Doğal Olay, Kazalar, Trafik Kazaları
          
          Metinden mümkün olduğunca fazla bilgi çıkar. Eksik bilgileri null olarak bırak.
          extractedFields alanında tüm çıkarılan bilgileri detaylı olarak ver.
          
          JSON formatında yanıt ver.`
        },
        {
          role: "user",
          content: `Bu emniyet bilgi notunu analiz et ve önemli bilgileri çıkar: ${text}`
        }
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    return {
      eventDate: result.eventDate,
      suspect: result.suspect,
      victim: result.victim,
      crimeType: result.crimeType,
      location: result.location,
      summary: result.summary,
      suggestedFormat: result.suggestedFormat,
      extractedFields: result.extractedFields || {},
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