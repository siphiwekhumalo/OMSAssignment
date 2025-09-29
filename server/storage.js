import { randomUUID } from "crypto";

export class MemStorage {
  constructor() {
    this.users = new Map();
    this.processedDocuments = new Map();
  }

  async getUser(id) {
    return this.users.get(id);
  }

  async getUserByUsername(username) {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser) {
    const id = randomUUID();
    const user = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async createProcessedDocument(doc) {
    const id = randomUUID();
    const processedDoc = {
      ...doc,
      id,
      createdAt: new Date(),
    };
    this.processedDocuments.set(id, processedDoc);
    return processedDoc;
  }

  async getProcessedDocument(id) {
    return this.processedDocuments.get(id);
  }

  async getRecentProcessedDocuments(limit = 10) {
    const docs = Array.from(this.processedDocuments.values());
    return docs
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }
}

export const storage = new MemStorage();