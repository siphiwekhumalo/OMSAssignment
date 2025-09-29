import { createWorker } from 'tesseract.js';
import fs from 'fs/promises';
import path from 'path';

/**
 * Standard Document Text Extraction Service
 * 
 * Provides reliable text extraction using established libraries without AI dependency.
 * Supports PDF documents via pdfjs-dist and images via Tesseract.js OCR.
 * Optimized for speed and consistency across different document formats.
 * 
 * @author Document Processing Application
 * @version 1.0.0
 */

/**
 * Main entry point for standard text extraction from documents
 * 
 * Automatically detects document type and applies appropriate extraction strategy.
 * Uses format-specific libraries for optimal accuracy and performance without
 * external API dependencies.
 * 
 * @param {string} filePath - Absolute path to the document file
 * @param {string} mimeType - MIME type of the document (application/pdf, image/jpeg, etc.)
 * @returns {Promise<string>} Raw extracted text content
 * @throws {Error} When file type is unsupported or extraction fails
 * 
 * @example
 * const text = await extractTextFromDocument('/uploads/document.pdf', 'application/pdf');
 * console.log(`Extracted ${text.length} characters`);
 */
export async function extractTextFromDocument(filePath, mimeType) {
  try {
    // Route to appropriate extraction method based on file type
    if (mimeType === 'application/pdf') {
      // PDF Strategy: Use Mozilla's PDF.js for reliable text parsing
      return await extractTextFromPDF(filePath);
    } else if (mimeType.startsWith('image/')) {
      // Image Strategy: Use Tesseract.js OCR for text recognition
      return await extractTextFromImage(filePath);
    } else {
      // Unsupported format - provide clear error message
      throw new Error(`Unsupported file type: ${mimeType}`);
    }
  } catch (error) {
    // Centralized error handling with consistent messaging
    console.error('Text extraction error:', error);
    throw new Error(`Failed to extract text: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Extracts text content from PDF documents using pdfjs-dist library
 * 
 * Handles PDF parsing at the binary level using Mozilla's PDF.js engine.
 * Processes all pages sequentially and includes page markers for better
 * organization. Robust error handling for individual page failures.
 * 
 * @private
 * @param {string} filePath - Path to the PDF file
 * @returns {Promise<string>} Extracted text with page markers
 * @throws {Error} When PDF cannot be loaded or contains no readable text
 * 
 * @example
 * const text = await extractTextFromPDF('/uploads/report.pdf');
 * // Returns: "--- Page 1 ---\nContent...\n--- Page 2 ---\nMore content..."
 */
async function extractTextFromPDF(filePath) {
  try {
    console.log('Attempting PDF extraction from:', filePath);
    
    // Read PDF file as binary data using async file operations
    const pdfBuffer = await fs.readFile(filePath);
    console.log('PDF buffer size:', pdfBuffer.length, 'bytes');
    
    // Import pdfjs-dist legacy build optimized for Node.js server environments
    const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
    
    // Configure PDF loading with system font support for better text rendering
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(pdfBuffer),
      useSystemFonts: true, // Improves text extraction accuracy
    });
    
    // Load PDF document and get basic metadata
    const pdfDocument = await loadingTask.promise;
    console.log('PDF loaded successfully, pages:', pdfDocument.numPages);
    
    let extractedText = '';
    
    // Process each page sequentially with individual error handling
    for (let pageNum = 1; pageNum <= pdfDocument.numPages; pageNum++) {
      try {
        // Extract page content using PDF.js text extraction API
        const page = await pdfDocument.getPage(pageNum);
        const textContent = await page.getTextContent();
        
        // Reconstruct text from individual text items
        // PDF text is typically fragmented and needs to be reassembled
        const pageText = textContent.items
          .map(item => item.str)
          .join(' '); // Join fragments with spaces to preserve word boundaries
        
        // Add page content with clear page markers for organization
        if (pageText.trim()) {
          extractedText += `\n--- Page ${pageNum} ---\n${pageText}\n`;
        }
      } catch (pageError) {
        // Handle individual page errors gracefully - continue with other pages
        console.error(`Error extracting text from page ${pageNum}:`, pageError);
        extractedText += `\n--- Page ${pageNum} ---\n[Error extracting text from this page]\n`;
        // Don't throw here - partial extraction is better than total failure
      }
    }
    
    // Clean up whitespace and validate final result
    extractedText = extractedText.trim();
    
    // Ensure we extracted meaningful content
    if (!extractedText || extractedText.length === 0) {
      throw new Error('No text content found in PDF document');
    }
    
    console.log('PDF text extraction successful, text length:', extractedText.length, 'characters');
    return extractedText;
    
  } catch (error) {
    // Enhanced error logging for PDF processing debugging
    console.error('PDF extraction error:', error);
    throw new Error(`Failed to extract text from PDF: ${error.message}`);
  }
}

/**
 * Extracts text from images using Tesseract.js OCR engine
 * 
 * Utilizes Google's Tesseract OCR technology to recognize text in images.
 * Supports various image formats (JPEG, PNG, etc.) with automatic language
 * detection. Includes proper worker cleanup to prevent memory leaks.
 * 
 * @private
 * @param {string} filePath - Path to the image file
 * @returns {Promise<string>} OCR-extracted text content
 * @throws {Error} When OCR processing fails
 * 
 * @example
 * const text = await extractTextFromImage('/uploads/screenshot.png');
 * console.log(`OCR extracted: ${text}`);
 */
async function extractTextFromImage(filePath) {
  let worker = null;
  
  try {
    // Initialize Tesseract.js worker with English language model
    // Worker creation is expensive, so we reuse it within this function scope
    worker = await createWorker('eng');
    
    // Perform OCR recognition on the image file
    // Tesseract automatically handles various image formats and preprocessing
    const { data: { text } } = await worker.recognize(filePath);
    
    // Return cleaned text (remove extra whitespace)
    return text.trim();
  } catch (error) {
    // Log OCR-specific errors for debugging
    console.error('OCR extraction error:', error);
    throw new Error('Failed to extract text from image using OCR');
  } finally {
    // CRITICAL: Always clean up the worker to prevent memory leaks
    // Tesseract workers consume significant memory and must be terminated
    if (worker) {
      await worker.terminate();
    }
  }
}