import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, jsonb, boolean } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  registryNumber: text("registry_number").notNull().unique(),
  name: text("name").notNull(),
  title: text("title").notNull(),
  password: text("password").notNull(),
  isAdmin: boolean("is_admin").default(false).notNull(),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
});

export const templates = pgTable("templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  type: text("type").notNull(), // violence, sexual, victim-status, etc.
  fields: jsonb("fields").notNull(), // Template field definitions
  version: text("version").default("1.0").notNull(),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`now()`).notNull(),
});

export const informationNotes = pgTable("information_notes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  templateId: varchar("template_id").notNull().references(() => templates.id),
  originalText: text("original_text").notNull(),
  aiAnalysis: jsonb("ai_analysis"), // AI extracted data
  formData: jsonb("form_data").notNull(), // User completed form data
  generatedDocument: text("generated_document").notNull(),
  subject: text("subject").notNull(),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  informationNotes: many(informationNotes),
}));

export const templatesRelations = relations(templates, ({ many }) => ({
  informationNotes: many(informationNotes),
}));

export const informationNotesRelations = relations(informationNotes, ({ one }) => ({
  user: one(users, {
    fields: [informationNotes.userId],
    references: [users.id],
  }),
  template: one(templates, {
    fields: [informationNotes.templateId],
    references: [templates.id],
  }),
}));

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertTemplateSchema = createInsertSchema(templates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertInformationNoteSchema = createInsertSchema(informationNotes).omit({
  id: true,
  createdAt: true,
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Template = typeof templates.$inferSelect;
export type InsertTemplate = z.infer<typeof insertTemplateSchema>;
export type InformationNote = typeof informationNotes.$inferSelect;
export type InsertInformationNote = z.infer<typeof insertInformationNoteSchema>;
