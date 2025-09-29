import { type User, type InsertUser, type ProcessedDocument, type InsertProcessedDocument } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Document processing methods
  createProcessedDocument(doc: InsertProcessedDocument): Promise<ProcessedDocument>;
  getProcessedDocument(id: string): Promise<ProcessedDocument | undefined>;
  getRecentProcessedDocuments(limit?: number): Promise<ProcessedDocument[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private processedDocuments: Map<string, ProcessedDocument>;

  constructor() {
    this.users = new Map();
    this.processedDocuments = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async createProcessedDocument(doc: InsertProcessedDocument): Promise<ProcessedDocument> {
    const id = randomUUID();
    const processedDoc: ProcessedDocument = {
      ...doc,
      id,
      createdAt: new Date(),
    };
    this.processedDocuments.set(id, processedDoc);
    return processedDoc;
  }

  async getProcessedDocument(id: string): Promise<ProcessedDocument | undefined> {
    return this.processedDocuments.get(id);
  }

  async getRecentProcessedDocuments(limit: number = 10): Promise<ProcessedDocument[]> {
    const docs = Array.from(this.processedDocuments.values());
    return docs
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime())
      .slice(0, limit);
  }
}

export const storage = new MemStorage();
