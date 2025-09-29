import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import fs from "fs/promises";
import { storage } from "./storage";
import { processDocumentRequestSchema } from "@shared/schema";
import { extractTextFromDocument } from "./services/extraction";
import { extractWithGemini } from "./services/gemini";

// Configure multer for file uploads
const upload = multer({
  dest: "uploads/",
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, JPG, and PNG files are allowed.'));
    }
  },
});

function calculateAge(dateOfBirth: string): number {
  const birthDate = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Document processing endpoint
  app.post('/api/process-document', upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      // Validate request body
      const validationResult = processDocumentRequestSchema.safeParse(req.body);
      if (!validationResult.success) {
        // Clean up uploaded file
        await fs.unlink(req.file.path).catch(() => {});
        return res.status(400).json({ 
          message: "Invalid request data",
          errors: validationResult.error.errors 
        });
      }

      const { firstName, lastName, dateOfBirth, processingMethod } = validationResult.data;
      const file = req.file;
      
      const startTime = Date.now();
      
      try {
        // Calculate age and full name
        const age = calculateAge(dateOfBirth);
        const fullName = `${firstName} ${lastName}`;
        
        // Extract text using standard method
        const standardText = await extractTextFromDocument(file.path, file.mimetype);
        
        let aiExtractedData = null;
        let rawExtractedText = standardText;
        
        // If AI method is selected, also extract with AI
        if (processingMethod === 'ai') {
          try {
            aiExtractedData = await extractWithGemini(file.path, file.mimetype);
            rawExtractedText = aiExtractedData.rawText || standardText;
          } catch (aiError) {
            console.error('AI extraction failed:', aiError);
            // Fall back to standard extraction if AI fails
            aiExtractedData = {
              structuredData: {},
              rawText: standardText,
            };
          }
        }
        
        const processingTime = Date.now() - startTime;
        
        // Save to storage
        const processedDocument = await storage.createProcessedDocument({
          firstName,
          lastName,
          dateOfBirth,
          fullName,
          age,
          fileName: file.originalname,
          fileType: file.mimetype,
          processingMethod,
          standardExtractedText: standardText,
          aiExtractedData,
          rawExtractedText,
          processingTime,
        });
        
        // Clean up uploaded file
        await fs.unlink(file.path).catch(() => {});
        
        res.json(processedDocument);
      } catch (processingError) {
        // Clean up uploaded file on processing error
        await fs.unlink(file.path).catch(() => {});
        console.error('Document processing error:', processingError);
        res.status(500).json({ 
          message: "Failed to process document",
          error: processingError instanceof Error ? processingError.message : String(processingError)
        });
      }
      
    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({ 
        message: "Upload failed",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Get recent processed documents
  app.get('/api/processed-documents', async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const documents = await storage.getRecentProcessedDocuments(limit);
      res.json(documents);
    } catch (error) {
      console.error('Error fetching processed documents:', error);
      res.status(500).json({ message: "Failed to fetch documents" });
    }
  });

  // Get specific processed document
  app.get('/api/processed-documents/:id', async (req, res) => {
    try {
      const document = await storage.getProcessedDocument(req.params.id);
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }
      res.json(document);
    } catch (error) {
      console.error('Error fetching document:', error);
      res.status(500).json({ message: "Failed to fetch document" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
