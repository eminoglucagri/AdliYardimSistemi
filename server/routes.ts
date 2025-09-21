import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}
import { storage } from "./storage";
import { analyzePoliceReport, generateJudicialDocument, resetOpenAIInstance } from "./services/openai";
import { generateWordDocument, generatePDFFromHTML } from "./services/document-generator";
import { seedTemplates } from "./seed-templates";
import { createAdminUser } from "./create-admin";
import multer from "multer";
import { z } from "zod";
import { readFileSync, unlinkSync } from "fs";

const upload = multer({ dest: "uploads/" });

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  // Middleware to check authentication
  const requireAuth = (req: any, res: any, next: any) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Giriş yapmanız gerekiyor" });
    }
    next();
  };

  const requireAdmin = (req: any, res: any, next: any) => {
    if (!req.isAuthenticated() || !req.user.isAdmin) {
      return res.status(403).json({ message: "Yönetici yetkisi gerekiyor" });
    }
    next();
  };

  // AI Analysis endpoint
  app.post("/api/analyze-text", requireAuth, async (req, res, next) => {
    try {
      const { text } = req.body;
      if (!text) {
        return res.status(400).json({ message: "Metin gereklidir" });
      }

      const analysis = await analyzePoliceReport(text);
      res.json(analysis);
    } catch (error) {
      next(error);
    }
  });

  // Templates endpoints
  app.get("/api/templates", requireAuth, async (req, res, next) => {
    try {
      const templates = await storage.getAllTemplates();
      res.json(templates);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/templates", requireAdmin, async (req, res, next) => {
    try {
      const template = await storage.createTemplate(req.body);
      res.status(201).json(template);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/templates/:id", requireAdmin, async (req, res, next) => {
    try {
      await storage.deleteTemplate(req.params.id);
      res.sendStatus(204);
    } catch (error) {
      next(error);
    }
  });

  // Information notes endpoints
  app.post("/api/information-notes", requireAuth, async (req, res, next) => {
    try {
      const { templateId, originalText, aiAnalysis, formData } = req.body;
      
      const template = await storage.getTemplateById(templateId);
      if (!template) {
        return res.status(404).json({ message: "Şablon bulunamadı" });
      }

      // Form verilerini AI verilerine öncelik vererek birleştir
      const { mapAIToCanonical } = await import("./services/openai");
      const canonicalData = mapAIToCanonical(aiAnalysis);
      const finalData = { ...canonicalData, ...formData }; // Form verileri öncelikli
      
      const generatedDocument = await generateJudicialDocument(template, finalData, aiAnalysis);
      
      const note = await storage.createInformationNote({
        userId: req.user!.id,
        templateId,
        originalText,
        aiAnalysis,
        formData,
        generatedDocument,
        subject: formData.subject || "Bilgi Notu",
      });

      res.status(201).json(note);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/information-notes", requireAuth, async (req, res, next) => {
    try {
      const {
        registryNumber,
        name,
        dateFrom,
        dateTo,
        searchText,
        page = "1",
        limit = "10",
      } = req.query;

      const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
      
      const result = await storage.searchInformationNotes({
        registryNumber: registryNumber as string,
        name: name as string,
        dateFrom: dateFrom ? new Date(dateFrom as string) : undefined,
        dateTo: dateTo ? new Date(dateTo as string) : undefined,
        searchText: searchText as string,
        limit: parseInt(limit as string),
        offset,
      });

      res.json(result);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/information-notes/:id", requireAuth, async (req, res, next) => {
    try {
      const note = await storage.getInformationNoteById(req.params.id);
      if (!note) {
        return res.status(404).json({ message: "Bilgi notu bulunamadı" });
      }
      res.json(note);
    } catch (error) {
      next(error);
    }
  });

  // Document generation endpoints
  app.post("/api/generate-word/:id", requireAuth, async (req, res, next) => {
    try {
      const note = await storage.getInformationNoteById(req.params.id);
      if (!note) {
        return res.status(404).json({ message: "Bilgi notu bulunamadı" });
      }

      const buffer = await generateWordDocument(note.generatedDocument, note.subject);
      
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
      res.setHeader("Content-Disposition", `attachment; filename="bilgi-notu-${note.id}.docx"`);
      res.send(buffer);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/generate-pdf/:id", requireAuth, async (req, res, next) => {
    try {
      const note = await storage.getInformationNoteById(req.params.id);
      if (!note) {
        return res.status(404).json({ message: "Bilgi notu bulunamadı" });
      }

      const html = generatePDFFromHTML(note.generatedDocument);
      
      res.setHeader("Content-Type", "text/html");
      res.send(html);
    } catch (error) {
      next(error);
    }
  });

  // User management endpoints (Admin only)
  app.get("/api/users", requireAdmin, async (req, res, next) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/users", requireAdmin, async (req, res, next) => {
    try {
      const { registryNumber, name, title, password, isAdmin } = req.body;
      const user = await storage.createUser({
        registryNumber,
        name,
        title,
        password: await hashPassword(password),
        isAdmin: isAdmin || false
      });
      res.status(201).json(user);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/admin/users/bulk-upload", requireAdmin, upload.single("csvFile"), async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "CSV dosyası gereklidir" });
      }

      const csvContent = readFileSync(req.file.path, "utf-8");
      const lines = csvContent.split("\n").filter(line => line.trim());
      
      if (lines.length === 0) {
        return res.status(400).json({ message: "CSV dosyası boş" });
      }

      const users = [];
      const errors = [];

      // Parse CSV lines (format: registryNumber,name,title,password)
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const [registryNumber, name, title, password] = line.split(",").map(field => field.trim());
        
        if (!registryNumber || !name || !title || !password) {
          errors.push(`Satır ${i + 1}: Eksik bilgi (Sicil No, Ad Soyad, Ünvan, Şifre gerekli)`);
          continue;
        }

        users.push({
          registryNumber,
          name,
          title,
          password: await hashPassword(password),
          isAdmin: false,
        });
      }

      if (errors.length > 0) {
        return res.status(400).json({ message: "CSV format hatası", errors });
      }

      const createdUsers = await storage.createUsersFromCSV(users);
      
      // Clean up the uploaded file
      try {
        unlinkSync(req.file.path);
      } catch (unlinkError) {
        console.warn("Could not delete uploaded file:", unlinkError);
      }
      
      res.json({ 
        message: "Kullanıcılar başarıyla yüklendi", 
        count: createdUsers.length,
        users: createdUsers.map(u => ({ id: u.id, registryNumber: u.registryNumber, name: u.name }))
      });
    } catch (error) {
      // Clean up the uploaded file in case of error
      if (req.file) {
        try {
          unlinkSync(req.file.path);
        } catch (unlinkError) {
          console.warn("Could not delete uploaded file:", unlinkError);
        }
      }
      next(error);
    }
  });

  app.patch("/api/users/:id/admin", requireAdmin, async (req, res, next) => {
    try {
      const { isAdmin } = req.body;
      await storage.updateUserAdminStatus(req.params.id, isAdmin);
      res.json({ message: "Kullanıcı yetkisi güncellendi" });
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/users/:id", requireAdmin, async (req, res, next) => {
    try {
      await storage.deleteUser(req.params.id);
      res.sendStatus(204);
    } catch (error) {
      next(error);
    }
  });

  // Şifre değiştirme endpoint'i
  app.post("/api/user/change-password", requireAuth, async (req, res, next) => {
    try {
      const { currentPassword, newPassword } = req.body;
      
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "Mevcut şifre ve yeni şifre gereklidir" });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ message: "Yeni şifre en az 6 karakter olmalıdır" });
      }

      // Mevcut kullanıcı bilgilerini al
      const user = await storage.getUserById(req.user!.id);
      if (!user) {
        return res.status(404).json({ message: "Kullanıcı bulunamadı" });
      }

      // Mevcut şifre kontrolü
      const [storedHash, storedSalt] = user.password.split(".");
      const currentHashBuffer = (await scryptAsync(currentPassword, storedSalt, 64)) as Buffer;
      const currentHash = currentHashBuffer.toString("hex");
      
      if (currentHash !== storedHash) {
        return res.status(400).json({ message: "Mevcut şifre hatalı" });
      }

      // Yeni şifre ile mevcut şifre aynı mı kontrolü
      if (currentPassword === newPassword) {
        return res.status(400).json({ message: "Yeni şifre mevcut şifreden farklı olmalıdır" });
      }

      // Yeni şifreyi hashle
      const hashedNewPassword = await hashPassword(newPassword);
      
      // Şifreyi güncelle
      await storage.updateUserPassword(req.user!.id, hashedNewPassword);

      res.json({ message: "Şifre başarıyla değiştirildi" });
    } catch (error) {
      next(error);
    }
  });

  // Admin-only endpoints for viewing all user data
  app.get("/api/admin/notes", requireAdmin, async (req, res, next) => {
    try {
      const allNotes = await storage.getAllInformationNotes();
      res.json(allNotes);
    } catch (error) {
      next(error);
    }
  });

  // System settings management
  app.get("/api/admin/settings", requireAdmin, async (req, res, next) => {
    try {
      const settings = await storage.getAllSystemSettings();
      res.json(settings);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/admin/settings", requireAdmin, async (req, res, next) => {
    try {
      const { key, value, description } = req.body;
      
      if (!key || !value) {
        return res.status(400).json({ message: "Anahtar ve değer gereklidir" });
      }

      const setting = await storage.upsertSystemSetting({
        key,
        value,
        description,
        updatedBy: req.user!.id,
      });

      // Reset OpenAI instance when API key is updated
      if (key === "openai_api_key") {
        resetOpenAIInstance();
        console.log("OpenAI instance reset due to API key update");
      }
      
      res.json(setting);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/admin/settings/:key", requireAdmin, async (req, res, next) => {
    try {
      const setting = await storage.getSystemSetting(req.params.key);
      if (!setting) {
        return res.status(404).json({ message: "Ayar bulunamadı" });
      }
      res.json(setting);
    } catch (error) {
      next(error);
    }
  });

  // Create admin user endpoint (for initial setup - no auth required)
  app.post("/api/create-admin", async (req, res, next) => {
    try {
      const result = await createAdminUser();
      res.json(result);
    } catch (error) {
      next(error);
    }
  });

  // Seed templates endpoint (for initial setup)
  app.post("/api/seed-templates", requireAdmin, async (req, res, next) => {
    try {
      const result = await seedTemplates();
      res.json(result);
    } catch (error) {
      next(error);
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
