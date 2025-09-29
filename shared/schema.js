import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, jsonb, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const processedDocuments = pgTable("processed_documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  dateOfBirth: text("date_of_birth").notNull(),
  fullName: text("full_name").notNull(),
  age: integer("age").notNull(),
  fileName: text("file_name").notNull(),
  fileType: text("file_type").notNull(),
  processingMethod: text("processing_method").notNull(), // "standard" | "ai"
  standardExtractedText: text("standard_extracted_text"),
  aiExtractedData: jsonb("ai_extracted_data"),
  rawExtractedText: text("raw_extracted_text"),
  processingTime: integer("processing_time"), // in milliseconds
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertProcessedDocumentSchema = createInsertSchema(processedDocuments).omit({
  id: true,
  createdAt: true,
});

/**
 * Schema for document processing request validation
 * Provides comprehensive validation for all form inputs with detailed error messages
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
 * Validates file type, size, and other constraints
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