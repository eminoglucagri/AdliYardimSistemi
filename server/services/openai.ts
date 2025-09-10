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
          - violence: Kadına ve Çocuğa Şiddet
          - sexual: Cinsel Saldırı/İstismar
          - victim-status: Mağdurun Vasıf Sebebiyle Önem Arz Eden Olaylar
          - suspect-status: Şüphelinin Vasıf Sebebiyle Önem Arz Eden Olaylar
          - legal-personnel: Hâkim-Savcı-Avukat Olayları
          - organized-crime: Organize Suç Örgütü
          - public-order: Kamu Düzenine Karşı İşlenen Suçlar
          - accidents: Patlama, Doğal Olay, Kazalar
          
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

export async function generateJudicialDocument(
  template: any,
  formData: Record<string, any>,
  aiAnalysis: AIAnalysisResult
): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: `Sen Türk adli sisteminde resmi belge formatında bilgi notu hazırlayan bir asistansın. 
          Verilen şablon ve verilere göre resmi adli bilgi notu oluştur. 
          Türkçe, resmi dil kullan ve hukuki format kurallarına uy.`
        },
        {
          role: "user",
          content: `Şablon: ${JSON.stringify(template)}
          Form Verileri: ${JSON.stringify(formData)}
          AI Analizi: ${JSON.stringify(aiAnalysis)}
          
          Bu bilgilere göre resmi adli bilgi notu oluştur.`
        }
      ],
    });

    return response.choices[0].message.content || "";
  } catch (error) {
    console.error("Document generation failed:", error);
    throw new Error("Belge oluşturma sırasında hata oluştu");
  }
}
