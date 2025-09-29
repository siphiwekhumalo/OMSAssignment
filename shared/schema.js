import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, jsonb, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

/**
 * Database Schema Definition
 * 
 * Defines the complete data model for the document processing application using
 * Drizzle ORM with PostgreSQL. Includes user management, document processing
 * records, and comprehensive validation schemas for data integrity.
 * 
 * @author Document Processing Application  
 * @version 1.0.0
 * @requires drizzle-orm
 * @requires zod
 */

/**
 * Users table for authentication and user management
 * 
 * Stores user credentials with secure password hashing. Uses UUID primary keys
 * for better security and scalability compared to sequential integers.
 * 
 * @table users
 * @description User authentication and profile data
 */
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`), // UUID for security
  username: text("username").notNull().unique(),                  // Unique identifier for login
  password: text("password").notNull(),                          // Hashed password (never plain text)
});

/**
 * Processed documents table for storing extraction results
 * 
 * Central table for all document processing data. Stores both user-provided
 * information and extraction results from both standard and AI processing methods.
 * Supports side-by-side comparison of different extraction approaches.
 * 
 * @table processed_documents  
 * @description Document processing records with extraction results
 */
export const processedDocuments = pgTable("processed_documents", {
  // Primary identification
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`), // UUID for each processing record
  
  // User-provided personal information
  firstName: text("first_name").notNull(),                        // User's first name from form
  lastName: text("last_name").notNull(),                         // User's last name from form  
  dateOfBirth: text("date_of_birth").notNull(),                 // Birth date (ISO string format)
  fullName: text("full_name").notNull(),                        // Computed full name for display
  age: integer("age").notNull(),                                // Calculated age at processing time
  
  // Document metadata
  fileName: text("file_name").notNull(),                        // Original uploaded filename
  fileType: text("file_type").notNull(),                       // MIME type (application/pdf, image/jpeg, etc.)
  processingMethod: text("processing_method").notNull(),       // User's selected method: "standard" | "ai"
  
  // Extraction results - supports both methods for comparison
  standardExtractedText: text("standard_extracted_text"),      // Text from PDF.js/Tesseract.js
  aiExtractedData: jsonb("ai_extracted_data"),                // Structured data from OpenAI (JSON format)
  rawExtractedText: text("raw_extracted_text"),               // Raw text from AI extraction
  
  // Processing metadata
  processingTime: integer("processing_time"),                  // Duration in milliseconds
  createdAt: timestamp("created_at").defaultNow(),            // Record creation timestamp
});

// ============================================================================
// INSERT SCHEMAS - For creating new records with validation
// ============================================================================

/**
 * Schema for inserting new users
 * 
 * Validates user registration data. Excludes auto-generated fields like ID.
 * Used for user signup and authentication flows.
 * 
 * @type {z.ZodObject} Zod schema for user creation
 */
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,  // Required: unique username for login
  password: true,  // Required: will be hashed before storage
});

/**
 * Schema for inserting processed document records
 * 
 * Validates complete document processing data. Excludes auto-generated fields
 * like ID and timestamps. Used when storing processing results in database.
 * 
 * @type {z.ZodObject} Zod schema for document record creation
 */
export const insertProcessedDocumentSchema = createInsertSchema(processedDocuments).omit({
  id: true,        // Auto-generated UUID
  createdAt: true, // Auto-generated timestamp
});

// ============================================================================
// REQUEST VALIDATION SCHEMAS - For incoming API requests
// ============================================================================

/**
 * Schema for document processing request validation
 * 
 * Comprehensive validation for document upload form submissions. Includes
 * detailed error messages, regex patterns for names, date validation with
 * age range checking, and processing method validation.
 * 
 * Features:
 * - Name validation: Letters, spaces, hyphens, apostrophes only
 * - Date validation: Valid dates with reasonable age range (5-120 years)
 * - Processing method: Enum validation for "standard" or "ai"
 * 
 * @type {z.ZodObject} Zod schema for form validation
 * @example
 * const result = processDocumentRequestSchema.safeParse({
 *   firstName: "John",
 *   lastName: "Doe", 
 *   dateOfBirth: "1990-01-15",
 *   processingMethod: "ai"
 * });
 */
export const processDocumentRequestSchema = z.object({
  // First name validation - required, 2-50 characters, letters and spaces only
  firstName: z.string()
    .min(1, "First name is required")
    .min(2, "First name must be at least 2 characters")
    .max(50, "First name cannot exceed 50 characters")
    .regex(/^[a-zA-Z\s'-]+$/, "First name can only contain letters, spaces, hyphens and apostrophes"),
    
  // Last name validation - required, 2-50 characters, letters and spaces only  
  lastName: z.string()
    .min(1, "Last name is required")
    .min(2, "Last name must be at least 2 characters")
    .max(50, "Last name cannot exceed 50 characters")
    .regex(/^[a-zA-Z\s'-]+$/, "Last name can only contain letters, spaces, hyphens and apostrophes"),
    
  // Date of birth validation - required, valid date, reasonable age range
  dateOfBirth: z.string()
    .min(1, "Date of birth is required")
    .refine((date) => {
      const birthDate = new Date(date);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      
      // Check if it's a valid date
      if (isNaN(birthDate.getTime())) {
        return false;
      }
      
      // Check reasonable age range (5-120 years old)
      return age >= 5 && age <= 120 && birthDate <= today;
    }, "Please enter a valid date of birth (must be between 5-120 years old)"),
    
  // Processing method validation - must be one of the allowed methods
  processingMethod: z.enum(["standard", "ai"], {
    errorMap: () => ({ message: "Please select a processing method (Standard or AI Extraction)" })
  }),
});

/**
 * File validation schema for document uploads
 * 
 * Validates uploaded files to ensure they meet application requirements.
 * Protects against malicious uploads and ensures compatibility with
 * extraction services.
 * 
 * Validation rules:
 * - File type: Only PDF, JPG, JPEG, PNG allowed
 * - File size: Maximum 10MB to prevent server overload
 * - Filename: Must have a name with reasonable length limit
 * 
 * @type {z.ZodObject} Zod schema for file upload validation
 * @example
 * const result = fileValidationSchema.safeParse({
 *   mimetype: 'application/pdf',
 *   size: 2048000, // 2MB
 *   originalname: 'document.pdf'
 * });
 */
export const fileValidationSchema = z.object({
  mimetype: z.string()
    .refine(
      (type) => ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'].includes(type),
      "Only PDF, JPG, JPEG, and PNG files are allowed"
    ),
  size: z.number()
    .max(10 * 1024 * 1024, "File size cannot exceed 10MB")
    .min(1, "File cannot be empty"),
  originalname: z.string()
    .min(1, "File must have a name")
    .max(255, "Filename cannot exceed 255 characters")
});