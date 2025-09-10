import { users, templates, informationNotes, type User, type InsertUser, type Template, type InsertTemplate, type InformationNote, type InsertInformationNote } from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or, ilike, sql } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByRegistryNumber(registryNumber: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  updateUserAdminStatus(id: string, isAdmin: boolean): Promise<void>;
  deleteUser(id: string): Promise<void>;
  
  // Template methods
  getAllTemplates(): Promise<Template[]>;
  getTemplateById(id: string): Promise<Template | undefined>;
  createTemplate(template: InsertTemplate): Promise<Template>;
  deleteTemplate(id: string): Promise<void>;
  
  // Information Note methods
  createInformationNote(note: InsertInformationNote): Promise<InformationNote>;
  getInformationNotesByUser(userId: string): Promise<InformationNote[]>;
  searchInformationNotes(params: {
    registryNumber?: string;
    name?: string;
    dateFrom?: Date;
    dateTo?: Date;
    searchText?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ notes: InformationNote[]; total: number }>;
  getInformationNoteById(id: string): Promise<InformationNote | undefined>;
  
  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ pool, createTableIfMissing: true });
  }

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByRegistryNumber(registryNumber: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.registryNumber, registryNumber));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(users.name);
  }

  async updateUserAdminStatus(id: string, isAdmin: boolean): Promise<void> {
    await db.update(users).set({ isAdmin }).where(eq(users.id, id));
  }

  async deleteUser(id: string): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  async getAllTemplates(): Promise<Template[]> {
    return await db.select().from(templates).orderBy(templates.name);
  }

  async getTemplateById(id: string): Promise<Template | undefined> {
    const [template] = await db.select().from(templates).where(eq(templates.id, id));
    return template || undefined;
  }

  async createTemplate(insertTemplate: InsertTemplate): Promise<Template> {
    const [template] = await db
      .insert(templates)
      .values(insertTemplate)
      .returning();
    return template;
  }

  async deleteTemplate(id: string): Promise<void> {
    await db.delete(templates).where(eq(templates.id, id));
  }

  async createInformationNote(insertNote: InsertInformationNote): Promise<InformationNote> {
    const [note] = await db
      .insert(informationNotes)
      .values(insertNote)
      .returning();
    return note;
  }

  async getInformationNotesByUser(userId: string): Promise<InformationNote[]> {
    return await db
      .select()
      .from(informationNotes)
      .where(eq(informationNotes.userId, userId))
      .orderBy(desc(informationNotes.createdAt));
  }

  async searchInformationNotes(params: {
    registryNumber?: string;
    name?: string;
    dateFrom?: Date;
    dateTo?: Date;
    searchText?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ notes: InformationNote[]; total: number }> {
    const conditions = [];

    if (params.registryNumber) {
      conditions.push(ilike(users.registryNumber, `%${params.registryNumber}%`));
    }

    if (params.name) {
      conditions.push(ilike(users.name, `%${params.name}%`));
    }

    if (params.dateFrom) {
      conditions.push(eq(informationNotes.createdAt, params.dateFrom));
    }

    if (params.searchText) {
      conditions.push(
        or(
          ilike(informationNotes.originalText, `%${params.searchText}%`),
          ilike(informationNotes.generatedDocument, `%${params.searchText}%`),
          ilike(informationNotes.subject, `%${params.searchText}%`)
        )
      );
    }

    // Build the where condition
    const whereCondition = conditions.length > 0 ? and(...conditions) : undefined;

    // Get results with joins
    const query = db
      .select({
        note: informationNotes,
        user: users,
        template: templates,
      })
      .from(informationNotes)
      .innerJoin(users, eq(informationNotes.userId, users.id))
      .innerJoin(templates, eq(informationNotes.templateId, templates.id));

    const results = await (whereCondition ? query.where(whereCondition) : query)
      .orderBy(desc(informationNotes.createdAt))
      .limit(params.limit || 10)
      .offset(params.offset || 0);

    // Get total count
    const countQuery = db
      .select({ count: sql`count(*)` })
      .from(informationNotes)
      .innerJoin(users, eq(informationNotes.userId, users.id));
    
    const [{ count }] = await (whereCondition ? countQuery.where(whereCondition) : countQuery);

    return {
      notes: results.map(r => ({
        ...r.note,
        user: r.user,
        template: r.template,
      })) as any,
      total: Number(count),
    };
  }

  async getInformationNoteById(id: string): Promise<InformationNote | undefined> {
    const [note] = await db.select().from(informationNotes).where(eq(informationNotes.id, id));
    return note || undefined;
  }
}

export const storage = new DatabaseStorage();
