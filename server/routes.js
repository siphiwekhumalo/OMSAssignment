import { createServer } from "http";
import multer from "multer";
import path from "path";
import fs from "fs/promises";
import { storage } from "./storage.js";
import { processDocumentRequestSchema, fileValidationSchema } from "../shared/schema.js";
import { extractTextFromDocument } from "./services/extraction.js";
import { extractWithOpenAI } from "./services/openai.js";

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

function calculateAge(dateOfBirth) {
  const birthDate = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
}

export async function registerRoutes(app) {
  // Document processing endpoint
  app.post('/api/process-document', upload.single('file'), async (req, res) => {
    try {
      // Validate file upload
      if (!req.file) {
        return res.status(400).json({ 
          message: "No file uploaded",
          error: "Please select a file to upload",
          details: "A file is required to process the document",
          timestamp: new Date().toISOString()
        });
      }

      // Validate file properties (type, size, name)
      const fileValidation = fileValidationSchema.safeParse({
        mimetype: req.file.mimetype,
        size: req.file.size,
        originalname: req.file.originalname
      });

      if (!fileValidation.success) {
        // Clean up uploaded file
        await fs.unlink(req.file.path).catch(() => {});
        return res.status(400).json({ 
          message: "Invalid file",
          error: fileValidation.error.errors[0]?.message || "File validation failed",
          details: fileValidation.error.errors,
          timestamp: new Date().toISOString()
        });
      }

      // Validate request body data
      const bodyValidation = processDocumentRequestSchema.safeParse(req.body);
      if (!bodyValidation.success) {
        // Clean up uploaded file
        await fs.unlink(req.file.path).catch(() => {});
        const firstError = bodyValidation.error.errors[0];
        return res.status(400).json({ 
          message: "Invalid form data",
          error: firstError?.message || "Form validation failed",
          field: firstError?.path?.[0] || "unknown",
          details: bodyValidation.error.errors,
          timestamp: new Date().toISOString()
        });
      }

      const { firstName, lastName, dateOfBirth, processingMethod } = bodyValidation.data;
      const file = req.file;
      
      console.log('Processing method received:', processingMethod, typeof processingMethod);
      console.log('Request body:', req.body);
      
      const startTime = Date.now();
      
      try {
        // Calculate age and full name with proper error handling
        let age, fullName;
        try {
          age = calculateAge(dateOfBirth);
          fullName = `${firstName} ${lastName}`;
          
          // Validate calculated age
          if (age < 5 || age > 120) {
            throw new Error("Invalid date of birth - calculated age is outside reasonable range");
          }
        } catch (ageError) {
          // Clean up uploaded file
          await fs.unlink(file.path).catch(() => {});
          return res.status(400).json({
            message: "Invalid date of birth",
            error: ageError.message,
            field: "dateOfBirth",
            details: "Please provide a valid birth date for age calculation",
            timestamp: new Date().toISOString()
          });
        }
        
        // Always run standard extraction for comparison
        console.log('Running standard extraction...');
        let standardText;
        try {
          standardText = await extractTextFromDocument(file.path, file.mimetype);
          
          // Validate extraction result
          if (!standardText || standardText.trim().length === 0) {
            console.warn('Standard extraction returned empty text');
            standardText = "No text could be extracted from the document using standard methods.";
          }
        } catch (standardError) {
          console.error('Standard extraction failed:', standardError);
          // Clean up uploaded file
          await fs.unlink(file.path).catch(() => {});
          return res.status(500).json({
            message: "Document processing failed",
            error: "Could not extract text from the document. Please ensure the file is not corrupted and contains readable text.",
            details: standardError.message,
            timestamp: new Date().toISOString()
          });
        }
        
        // Always attempt AI extraction for side-by-side comparison
        let aiExtractedData = null;
        console.log('Running AI extraction...');
        try {
          aiExtractedData = await extractWithOpenAI(file.path, file.mimetype);
          
          // Validate AI extraction result
          if (!aiExtractedData) {
            throw new Error("AI extraction returned null result");
          }
        } catch (aiError) {
          console.error('AI extraction failed:', aiError);
          // Create fallback AI result with detailed error information
          const errorReason = aiError.message || "Unknown error";
          const isQuotaError = errorReason.includes("quota") || errorReason.includes("429");
          
          aiExtractedData = {
            structuredData: {
              error: "AI extraction failed",
              reason: isQuotaError ? "AI service quota exceeded" : "AI service temporarily unavailable",
              fallback: "Using standard extraction as fallback"
            },
            rawText: standardText,
            errorOccurred: true
          };
        }
        
        // Determine primary extracted text based on selected method
        const rawExtractedText = processingMethod === 'ai' && !aiExtractedData.errorOccurred 
          ? aiExtractedData.rawText || standardText 
          : standardText;
        
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
        
        // Provide detailed error responses based on error type
        let statusCode = 500;
        let errorMessage = "An unexpected error occurred while processing your document";
        let details = processingError instanceof Error ? processingError.message : String(processingError);
        
        // Handle specific processing error types
        if (details.includes('ENOENT')) {
          errorMessage = "The uploaded file could not be found or accessed";
          details = "Please try uploading the file again";
        } else if (details.includes('storage')) {
          errorMessage = "Failed to save processing results";
          details = "There was an issue saving your document. Please try again";
        } else if (details.includes('timeout')) {
          errorMessage = "Document processing timed out";
          details = "The document is taking too long to process. Please try again with a smaller file";
        }
        
        res.status(statusCode).json({ 
          message: "Document processing failed",
          error: errorMessage,
          details: details,
          timestamp: new Date().toISOString()
        });
      }
      
    } catch (error) {
      console.error('Upload error:', error);
      
      // Clean up any uploaded file
      if (req.file) {
        await fs.unlink(req.file.path).catch(() => {});
      }
      
      // Provide detailed error responses based on error type  
      let statusCode = 500;
      let errorMessage = "File upload failed";
      let details = error instanceof Error ? error.message : String(error);
      
      // Handle specific upload error types
      if (details.includes('LIMIT_FILE_SIZE')) {
        statusCode = 400;
        errorMessage = "File is too large";
        details = "Please select a file smaller than 10MB";
      } else if (details.includes('LIMIT_UNEXPECTED_FILE')) {
        statusCode = 400;
        errorMessage = "Invalid file upload";
        details = "Please ensure only one file is selected";
      } else if (details.includes('EMFILE') || details.includes('ENFILE')) {
        errorMessage = "Server is currently busy";
        details = "Too many files being processed. Please wait a moment and try again";
      }
      
      res.status(statusCode).json({ 
        message: "Upload failed",
        error: errorMessage,
        details: details,
        timestamp: new Date().toISOString()
      });
    }
  });

  // Get recent processed documents
  app.get('/api/processed-documents', async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit) : 10;
      const documents = await storage.getRecentProcessedDocuments(limit);
      res.json(documents);
    } catch (error) {
      console.error('Error fetching processed documents:', error);
      res.status(500).json({ 
        message: "Failed to fetch documents",
        error: "Unable to retrieve processed documents from storage",
        details: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  // Get specific processed document
  app.get('/api/processed-documents/:id', async (req, res) => {
    try {
      const document = await storage.getProcessedDocument(req.params.id);
      if (!document) {
        return res.status(404).json({ 
          message: "Document not found",
          error: "The requested document does not exist",
          details: "Please check the document ID and try again",
          timestamp: new Date().toISOString()
        });
      }
      res.json(document);
    } catch (error) {
      console.error('Error fetching document:', error);
      res.status(500).json({ 
        message: "Failed to fetch document",
        error: "Unable to retrieve the requested document",
        details: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  // Health check endpoint for Docker and monitoring
  app.get('/health', (req, res) => {
    res.status(200).json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      service: 'document-processing-app'
    });
  });

  const httpServer = createServer(app);
  return httpServer;
}