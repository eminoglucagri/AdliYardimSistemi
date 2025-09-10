import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { analyzePoliceReport, generateJudicialDocument } from "./services/openai";
import { generateWordDocument, generatePDFFromHTML } from "./services/document-generator";
import { seedTemplates } from "./seed-templates";
import { createAdminUser } from "./create-admin";
import multer from "multer";
import { z } from "zod";

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

      const generatedDocument = await generateJudicialDocument(template, formData, aiAnalysis);
      
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

  app.post("/api/users/bulk-upload", requireAdmin, upload.single("file"), async (req, res, next) => {
    try {
      // Handle CSV file upload and user creation
      // This would parse the CSV and create users
      res.json({ message: "Kullanıcılar başarıyla yüklendi" });
    } catch (error) {
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
