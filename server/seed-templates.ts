import { storage } from "./storage";

const defaultTemplates = [
  {
    name: "Kadına ve Çocuğa Şiddet",
    type: "violence",
    fields: {
      subject: { type: "text", label: "Konu", required: true },
      pressStatus: { type: "select", label: "Basına Düşme Durumu", options: ["Düştü", "Düşmedi"], required: true },
      victimInfo: { type: "textarea", label: "Mağdurun Kimliği ve Yaşı", required: true },
      maritalStatus: { type: "text", label: "Medeni Durumu", required: false },
      suspectInfo: { type: "textarea", label: "Şüphelinin Kimliği ve Mağdura Yakınlığı", required: true },
      eventDate: { type: "date", label: "Eylem Tarihi", required: true },
      crimeType: { type: "text", label: "Suç Adı/Sevk", required: true },
      eventLocation: { type: "textarea", label: "Eylemin Gerçekleşme Şekli ve Yeri", required: true },
      injuryType: { type: "textarea", label: "Yaralanmanın Niteliği", required: false },
      autopsyFindings: { type: "textarea", label: "Ölüm Varsa İlk Ölü Muayene/Otopsi Bulgularıı", required: false },
      protectiveMeasures: { type: "textarea", label: "Mağdur Hakkında Koruyucu Tedbir Durumu", required: false },
      suspectMeasures: { type: "textarea", label: "Şüpheli Hakkındaki Tedbir ve Tarihi", required: false },
      eventSummary: { type: "textarea", label: "Olayın Kısa Özeti", required: true },
    }
  },
  {
    name: "Cinsel Saldırı / İstismar",
    type: "sexual",
    fields: {
      subject: { type: "text", label: "Konu", required: true },
      pressStatus: { type: "select", label: "Basına Düşme Durumu", options: ["Düştü", "Düşmedi"], required: true },
      victimInfo: { type: "textarea", label: "Mağdurun Kimliği ve Yaşı", required: true },
      maritalStatus: { type: "text", label: "Medeni Durumu", required: false },
      suspectInfo: { type: "textarea", label: "Şüphelinin Kimliği", required: true },
      eventDate: { type: "date", label: "Eylem Tarihi", required: true },
      crimeType: { type: "text", label: "Suç Adı/Sevk", required: true },
      eventLocation: { type: "textarea", label: "Eylemin Gerçekleşme Şekli ve Yeri", required: true },
      eventRepetition: { type: "select", label: "Eylemin Tekrarlanıp Tekrarlanmadığı", options: ["Evet", "Hayır"], required: false },
      relationship: { type: "text", label: "Şüpheli ve Mağdur Arasındaki İlişki", required: false },
      medicalReport: { type: "textarea", label: "Mağdurun Doktor Raporu", required: false },
      protectiveMeasures: { type: "textarea", label: "Mağdur Hakkında Koruyucu Tedbir Durumu", required: false },
      suspectMeasures: { type: "textarea", label: "Şüpheli Hakkındaki Tedbir ve Tarihi", required: false },
      eventSummary: { type: "textarea", label: "Olayın Kısa Özeti", required: true },
    }
  },
  {
    name: "Mağdurun Vasıf Sebebiyle Önem Arz Eden Olaylar",
    type: "victim-status",
    fields: {
      subject: { type: "text", label: "Konu", required: true },
      pressStatus: { type: "select", label: "Basına Düşme Durumu", options: ["Düştü", "Düşmedi"], required: true },
      victimInfo: { type: "textarea", label: "Mağdurun Kimliği ve Vasıf", required: true },
      suspectInfo: { type: "textarea", label: "Şüphelinin Kimliği ve Vasıf", required: true },
      eventDate: { type: "date", label: "Eylem Tarihi", required: true },
      crimeType: { type: "text", label: "Suç Adı/Sevk", required: true },
      eventLocation: { type: "textarea", label: "Eylemin Gerçekleşme Şekli ve Yeri", required: true },
      suspectMeasures: { type: "textarea", label: "Şüpheli Hakkındaki Tedbir ve Tarihi", required: false },
      eventSummary: { type: "textarea", label: "Olayın Kısa Özeti", required: true },
    }
  },
  {
    name: "Şüphelinin Vasıf Sebebiyle Önem Arz Eden Olaylar",
    type: "suspect-status",
    fields: {
      subject: { type: "text", label: "Konu", required: true },
      pressStatus: { type: "select", label: "Basına Düşme Durumu", options: ["Düştü", "Düşmedi"], required: true },
      suspectInfo: { type: "textarea", label: "Şüphelinin Kimliği ve Vasıf", required: true },
      victimInfo: { type: "textarea", label: "Varsa Mağdurun Kimliği ve Vasıf", required: false },
      eventDate: { type: "date", label: "Eylem Tarihi", required: true },
      crimeType: { type: "text", label: "Suç Adı/Sevk", required: true },
      eventLocation: { type: "textarea", label: "Eylemin Gerçekleşme Şekli ve Yeri", required: true },
      suspectMeasures: { type: "textarea", label: "Şüpheli Hakkındaki Tedbir ve Tarihi", required: false },
      eventSummary: { type: "textarea", label: "Olayın Kısa Özeti", required: true },
    }
  },
  {
    name: "Hâkim - Savcı - Avukat Olayları",
    type: "legal-personnel",
    fields: {
      subject: { type: "text", label: "Konu", required: true },
      pressStatus: { type: "select", label: "Basına Düşme Durumu", options: ["Düştü", "Düşmedi"], required: true },
      suspectInfo: { type: "textarea", label: "Şüphelinin Kimliği Görev Yeri, Sicili", required: true },
      victimInfo: { type: "textarea", label: "Mağdurun Kimliği, Görev Yeri, Sicili", required: true },
      eventDate: { type: "date", label: "Eylem Tarihi", required: true },
      crimeType: { type: "text", label: "Suç Adı/Sevk", required: true },
      eventMethod: { type: "textarea", label: "Eylemin Gerçekleşme Şekli", required: true },
      eventLocation: { type: "textarea", label: "Eylemin Yeri", required: true },
      suspectMeasures: { type: "textarea", label: "Şüpheli Hakkındaki Tedbir ve Tarihi", required: false },
      eventSummary: { type: "textarea", label: "Olayın Kısa Özeti", required: true },
    }
  },
  {
    name: "Organize Suç Örgütü - Toplumun Geneline Yayılan Ekonomi Alanında İşlenen Suçlar",
    type: "organized-crime",
    fields: {
      subject: { type: "text", label: "Konu", required: true },
      pressStatus: { type: "select", label: "Basına Düşme Durumu", options: ["Düştü", "Düşmedi"], required: true },
      organizationPurpose: { type: "textarea", label: "Örgütün Kuruluş Amacı", required: true },
      suspectInfo: { type: "textarea", label: "Şüphelinin Kimliği, Vasıf ve Sayısı", required: true },
      suspectJob: { type: "text", label: "Şüphelinin Mesleği/Görevi", required: false },
      eventDate: { type: "date", label: "Eylem Tarihi", required: true },
      organizedCrime: { type: "text", label: "Organize Şekilde İşlenen Suç Adı/Sevk", required: true },
      victimSuspectCount: { type: "textarea", label: "Mağdur ve Şüpheli Sayısı, Kimlik Bilgileri", required: true },
      damageAmount: { type: "text", label: "Zarar Miktarı", required: false },
      suspectMeasures: { type: "textarea", label: "Şüpheli Hakkındaki Tedbir ve Tarihi", required: false },
      eventSummary: { type: "textarea", label: "Olayın Kısa Özeti", required: true },
    }
  },
  {
    name: "Kamu Düzenine Karşı İşlenen Suçlar",
    type: "public-order",
    fields: {
      subject: { type: "text", label: "Konu", required: true },
      pressStatus: { type: "select", label: "Basına Düşme Durumu", options: ["Düştü", "Düşmedi"], required: true },
      suspectInfo: { type: "textarea", label: "Şüphelinin Kimliği ve Vasıf", required: true },
      mentalDisability: { type: "select", label: "Zihinsel Engellilik Durumunun Bulunup Bulunmadığı", options: ["Var", "Yok"], required: false },
      targetGroup: { type: "text", label: "Eylemin Yöneldiği Kesim", required: false },
      crimeType: { type: "text", label: "Suç Adı/Sevk", required: true },
      eventDate: { type: "date", label: "Eylem Tarihi", required: true },
      eventLocation: { type: "textarea", label: "Eylemin Gerçekleşme Şekli ve Yeri", required: true },
      speechContent: { type: "textarea", label: "Söz ve Eylemlerin İçeriği", required: false },
      suspectMeasures: { type: "textarea", label: "Şüpheli Hakkındaki Tedbir ve Tarihi", required: false },
      eventSummary: { type: "textarea", label: "Olayın Kısa Özeti", required: true },
    }
  },
  {
    name: "Patlama, Doğal Olay, Kazalar",
    type: "accidents",
    fields: {
      subject: { type: "text", label: "Konu", required: true },
      pressStatus: { type: "select", label: "Basına Düşme Durumu", options: ["Düştü", "Düşmedi"], required: true },
      eventDateTime: { type: "datetime", label: "Olayın Gerçekleşme Tarihi ve Saati", required: true },
      victimInfo: { type: "textarea", label: "Ölen ya da Mağdurun Kimliği, Sayısı", required: false },
      suspectInfo: { type: "textarea", label: "Şüpheli/Şüphelilerin Kimliği Sayısı", required: false },
      crimeType: { type: "text", label: "Suç Adı/Sevk", required: true },
      faultSituations: { type: "textarea", label: "Tespit Edilmişse Kusur Durumları", required: false },
      trafficViolations: { type: "textarea", label: "Trafik Kazası Yönünden Alkol, Ehliyetsizlik ya da Kural İhlalinin Olup Olmadığı", required: false },
      suspectMeasures: { type: "textarea", label: "Şüpheli Hakkındaki Tedbir ve Tarihi", required: false },
      eventMethod: { type: "textarea", label: "Olayın Gerçekleşme Şekli", required: true },
      healthStatus: { type: "textarea", label: "Yaralıların Sağlık Durumları", required: false },
      eventSummary: { type: "textarea", label: "Olayın Kısa Özeti", required: true },
    }
  }
];

export async function seedTemplates() {
  console.log("Starting to seed templates...");
  
  try {
    // Check if templates already exist
    const existingTemplates = await storage.getAllTemplates();
    if (existingTemplates.length > 0) {
      console.log("Templates already exist. Skipping seeding.");
      return { message: "Templates already exist" };
    }

    // Create each template
    for (const templateData of defaultTemplates) {
      console.log(`Creating template: ${templateData.name}`);
      await storage.createTemplate(templateData);
    }

    console.log("Successfully seeded all templates!");
    return { message: "Templates seeded successfully", count: defaultTemplates.length };
  } catch (error) {
    console.error("Error seeding templates:", error);
    throw error;
  }
}