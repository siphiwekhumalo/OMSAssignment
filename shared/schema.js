import { z } from "zod";

/**
 * Validation Schemas for Document Processing Application
 * 
 * Defines comprehensive validation schemas using Zod for form data validation
 * and type safety. Focuses on document processing workflows without database
 * dependencies for maximum simplicity and portability.
 * 
 * @author Document Processing Application  
 * @version 1.0.0
 * @requires zod
 */

// ============================================================================  
// VALIDATION SCHEMAS - For form validation and data processing
// ============================================================================

/**
 * Document processing request schema
 * 
 * Validates document processing form data including personal information,
 * file metadata, and processing method selection.
 * 
 * @validation
 * - Personal info: Non-empty names, valid birth date format
 * - File metadata: Supported MIME types, reasonable filename lengths  
 * - Processing: Valid method selection (standard or ai)
 * 
 * @example
 * const docRequest = processDocumentRequestSchema.parse({
 *   firstName: "John",
 *   lastName: "Doe", 
 *   dateOfBirth: "1990-05-15",
 *   processingMethod: "ai"
 * });
 */
export const processDocumentRequestSchema = z.object({
  // Personal information validation
  firstName: z.string()
    .min(1, "First name is required")
    .max(100, "First name must be less than 100 characters")
    .regex(/^[a-zA-Z\s'-]+$/, "First name can only contain letters, spaces, hyphens, and apostrophes"),
  
  lastName: z.string()
    .min(1, "Last name is required")
    .max(100, "Last name must be less than 100 characters")
    .regex(/^[a-zA-Z\s'-]+$/, "Last name can only contain letters, spaces, hyphens, and apostrophes"),
  
  // Date validation with reasonable bounds
  dateOfBirth: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date of birth must be in YYYY-MM-DD format")
    .refine((date) => {
      const birthDate = new Date(date);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      return age >= 0 && age <= 150; // Reasonable age bounds
    }, "Please enter a valid date of birth"),
  
  // Processing method validation
  processingMethod: z.enum(["standard", "ai"], {
    errorMap: () => ({ message: "Processing method must be either 'standard' or 'ai'" })
  }),
});

/**
 * File validation schema for upload validation
 * 
 * Validates uploaded file properties including type, size, and filename.
 * Used for client-side and server-side file validation.
 * 
 * @validation
 * - File type: PDF, JPG, JPEG, PNG only
 * - File size: Maximum 10MB
 * - Filename: Reasonable length limits
 * 
 * @example
 * const fileValidation = fileValidationSchema.parse({
 *   mimetype: "application/pdf",
 *   size: 5242880,
 *   originalname: "document.pdf"
 * });
 */
export const fileValidationSchema = z.object({
  mimetype: z.string()
    .regex(/^(application\/pdf|image\/(jpeg|jpg|png))$/, 
           "File must be PDF, JPG, JPEG, or PNG format"),
  
  size: z.number()
    .max(10 * 1024 * 1024, "File size must be less than 10MB")
    .positive("File size must be greater than 0"),
  
  originalname: z.string()
    .min(1, "Filename is required")
    .max(255, "Filename must be less than 255 characters")
    .regex(/\.(pdf|jpe?g|png)$/i, "File must have a valid extension (.pdf, .jpg, .jpeg, .png)"),
});

// ============================================================================
// TYPE DEFINITIONS - For JSDoc documentation (TypeScript types in comments)
// ============================================================================

/**
 * @typedef {Object} ProcessDocumentRequest
 * @property {string} firstName - User's first name
 * @property {string} lastName - User's last name  
 * @property {string} dateOfBirth - Date of birth in YYYY-MM-DD format
 * @property {'standard'|'ai'} processingMethod - Processing method selection
 */

/**
 * @typedef {Object} FileValidation
 * @property {string} mimetype - File MIME type
 * @property {number} size - File size in bytes
 * @property {string} originalname - Original filename
 */

/**
 * @typedef {Object} ProcessingResult
 * @property {string} id - Unique document ID
 * @property {string} firstName - User's first name
 * @property {string} lastName - User's last name
 * @property {string} dateOfBirth - Date of birth
 * @property {string} fullName - Combined full name
 * @property {number} age - Calculated age
 * @property {string} fileName - Original file name
 * @property {string} fileType - File MIME type
 * @property {'standard'|'ai'} processingMethod - Processing method used
 * @property {string} [standardExtractedText] - Text from standard extraction
 * @property {Object} [aiExtractedData] - AI extraction results
 * @property {string} [rawExtractedText] - Raw AI extracted text
 * @property {number} [processingTime] - Processing duration in ms
 * @property {Date} createdAt - Creation timestamp
 */

// ============================================================================
// UTILITY FUNCTIONS - Helper functions for data processing
// ============================================================================

/**
 * Calculate age from date of birth string
 * 
 * @param {string} dateOfBirth - Date in YYYY-MM-DD format
 * @returns {number} Age in years
 */
export function calculateAge(dateOfBirth) {
  const birthDate = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
}

/**
 * Generate full name from first and last name
 * 
 * @param {string} firstName - First name
 * @param {string} lastName - Last name  
 * @returns {string} Full name
 */
export function generateFullName(firstName, lastName) {
  return `${firstName} ${lastName}`.trim();
}