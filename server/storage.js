import { randomUUID } from "crypto";

/**
 * Simple in-memory storage for document processing results
 * 
 * Provides temporary storage for processed documents during the current session.
 * Documents are kept in memory for the results page but not persisted between
 * server restarts. Perfect for a stateless document processing service.
 */
export class MemStorage {
  constructor() {
    this.processedDocuments = new Map();
  }

  /**
   * Store a processed document result
   * 
   * @param {Object} doc - Document processing result
   * @returns {Object} Stored document with ID and timestamp
   */
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

  /**
   * Get a specific processed document by ID
   * 
   * @param {string} id - Document ID
   * @returns {Object|undefined} Document or undefined if not found
   */
  async getProcessedDocument(id) {
    return this.processedDocuments.get(id);
  }

  /**
   * Get recent processed documents for display
   * 
   * @param {number} limit - Maximum number of documents to return
   * @returns {Array} Array of processed documents, newest first
   */
  async getRecentProcessedDocuments(limit = 10) {
    const docs = Array.from(this.processedDocuments.values());
    return docs
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }

  /**
   * Clear all stored documents (useful for cleanup)
   */
  async clearAll() {
    this.processedDocuments.clear();
  }

  /**
   * Get total count of stored documents
   * 
   * @returns {number} Total number of documents in memory
   */
  async getDocumentCount() {
    return this.processedDocuments.size;
  }
}

export const storage = new MemStorage();