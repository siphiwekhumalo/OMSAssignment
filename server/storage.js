import { randomUUID } from "crypto";


export class MemStorage {
  constructor() {
    this.processedDocuments = new Map();
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

 
  async clearAll() {
    this.processedDocuments.clear();
  }

  
  async getDocumentCount() {
    return this.processedDocuments.size;
  }
}

export const storage = new MemStorage();