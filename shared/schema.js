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

export const processDocumentRequestSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  processingMethod: z.enum(["standard", "ai"]),
});