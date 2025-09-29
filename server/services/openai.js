import fs from "fs";
import OpenAI from "openai";

/**
 * OpenAI Document Processing Service
 * 
 * Provides AI-powered text extraction and structured data parsing for documents.
 * Supports both PDF and image formats with intelligent content analysis.
 * 
 * @author Document Processing Application
 * @version 1.0.0
 */

// Initialize OpenAI client with API key from environment
// Note: Using gpt-5 model as specified in the integration blueprint
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Main entry point for AI-powered document extraction
 * 
 * Processes documents using OpenAI's advanced models to extract both raw text
 * and structured data. Automatically handles different file types with 
 * format-specific processing strategies.
 * 
 * @param {string} filePath - Absolute path to the document file
 * @param {string} mimeType - MIME type of the document (application/pdf, image/jpeg, etc.)
 * @returns {Promise<{structuredData: Object, rawText: string}>} Extracted content with structured data and raw text
 * @throws {Error} When file type is unsupported or extraction fails
 * 
 * @example
 * const result = await extractWithOpenAI('/path/to/document.pdf', 'application/pdf');
 * console.log(result.structuredData); // { name: "John Doe", email: "john@example.com" }
 * console.log(result.rawText); // "Full document text content..."
 */
export async function extractWithOpenAI(filePath, mimeType) {
  try {
    // Route processing based on file type for optimal extraction strategy
    if (mimeType === 'application/pdf') {
      // PDF Strategy: Extract text using pdfjs-dist, then enhance with AI analysis
      // This hybrid approach ensures accurate text extraction followed by intelligent parsing
      const extractedText = await extractPDFText(filePath);
      return await extractTextWithAI(extractedText);
    } else if (mimeType.startsWith('image/')) {
      // Image Strategy: Direct AI analysis using vision capabilities
      // OpenAI's vision models can simultaneously extract text and identify structured data
      return await extractImageWithAI(filePath, mimeType);
    } else {
      // Unsupported format - provide clear error message
      throw new Error(`Unsupported file type for AI extraction: ${mimeType}`);
    }
  } catch (error) {
    // Enhanced error handling with proper OpenAI SDK error structure detection
    console.error('OpenAI extraction error:', error);
    
    // Handle OpenAI SDK errors using structured properties when available
    if (error && typeof error === 'object') {
      // Check for OpenAI SDK error structure first
      if (error.status || error.type || error.code) {
        // Quota/rate limit errors (429 status or specific types)
        if (error.status === 429 || error.type === 'insufficient_quota' || error.code === 'rate_limit_exceeded') {
          throw new Error('AI service quota exceeded. Please check your OpenAI account usage limits or try using Standard Extraction instead.');
        }
        
        // Authentication errors (401 status or auth-related types)
        if (error.status === 401 || error.type === 'invalid_request_error' || error.code === 'invalid_api_key') {
          throw new Error('AI service authentication failed. Please check your OpenAI API key configuration.');
        }
        
        // Service unavailable errors (500+ status codes)
        if (error.status >= 500) {
          throw new Error('AI service temporarily unavailable. Please try Standard Extraction or try again later.');
        }
      }
      
      // Fallback to message inspection for other error types
      const errorMessage = error.message || String(error);
      throw new Error(`AI extraction failed: ${errorMessage}. Try using Standard Extraction as an alternative.`);
    }
    
    // Handle non-object errors
    throw new Error(`AI extraction failed: ${String(error)}. Try using Standard Extraction as an alternative.`);
  }
}

/**
 * Extracts raw text content from PDF documents using pdfjs-dist
 * 
 * This function handles PDF parsing at the binary level, extracting text content
 * from all pages. It uses Mozilla's PDF.js library for reliable text extraction
 * across different PDF formats and versions.
 * 
 * @private
 * @param {string} filePath - Path to the PDF file
 * @returns {Promise<string>} Extracted text content from all pages
 * @throws {Error} When PDF cannot be loaded or contains no readable text
 * 
 * @example
 * const text = await extractPDFText('/uploads/document.pdf');
 * console.log(`Extracted ${text.length} characters from PDF`);
 */
async function extractPDFText(filePath) {
  try {
    console.log('AI: Attempting PDF text extraction from:', filePath);
    
    // Read the PDF file as binary data for processing
    const pdfBuffer = fs.readFileSync(filePath);
    console.log('AI: PDF buffer size:', pdfBuffer.length, 'bytes');
    
    // Import pdfjs-dist legacy build optimized for Node.js environments
    // Legacy build provides better compatibility with server-side processing
    const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
    
    // Configure PDF loading with optimal settings for text extraction
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(pdfBuffer),
      useSystemFonts: true, // Enable system fonts for better text rendering
    });
    
    // Load the PDF document and get metadata
    const pdfDocument = await loadingTask.promise;
    console.log('AI: PDF loaded successfully, pages:', pdfDocument.numPages);
    
    let extractedText = '';
    
    // Process each page sequentially to preserve document structure
    for (let pageNum = 1; pageNum <= pdfDocument.numPages; pageNum++) {
      try {
        // Get page object and extract text content
        const page = await pdfDocument.getPage(pageNum);
        const textContent = await page.getTextContent();
        
        // Combine individual text items into coherent page text
        // PDF text is often fragmented into small pieces that need to be joined
        const pageText = textContent.items
          .map(item => item.str)
          .join(' '); // Join with spaces to maintain word separation
        
        // Only add non-empty pages to final text
        if (pageText.trim()) {
          extractedText += `${pageText}\n`; // Add newline between pages
        }
      } catch (pageError) {
        // Log page-specific errors but continue processing other pages
        console.error(`AI: Error extracting text from page ${pageNum}:`, pageError);
        // Don't throw here - partial extraction is better than complete failure
      }
    }
    
    // Clean up the final extracted text
    extractedText = extractedText.trim();
    
    // Validate that we extracted meaningful content
    if (!extractedText || extractedText.length === 0) {
      throw new Error('No text content found in PDF document');
    }
    
    console.log('AI: PDF text extraction successful, text length:', extractedText.length, 'characters');
    return extractedText;
    
  } catch (error) {
    // Enhanced error logging for PDF processing issues
    console.error('AI: PDF extraction error:', error);
    throw new Error(`Failed to extract text from PDF: ${error.message}`);
  }
}

/**
 * Extracts text and structured data from images using OpenAI's vision capabilities
 * 
 * This function leverages OpenAI's advanced vision models to perform OCR and 
 * intelligent content analysis on images. It uses a two-pass approach:
 * 1. Raw text extraction for complete content capture
 * 2. Structured data extraction for organized information parsing
 * 
 * @private
 * @param {string} imagePath - Path to the image file
 * @param {string} mimeType - MIME type of the image (image/jpeg, image/png, etc.)
 * @returns {Promise<{structuredData: Object, rawText: string}>} Combined extraction results
 * @throws {Error} When image processing fails or API quota is exceeded
 * 
 * @example
 * const result = await extractImageWithAI('/uploads/license.jpg', 'image/jpeg');
 * // result.structuredData = { "License Number": "ABC123", "Expiry": "2025-12-31" }
 * // result.rawText = "Driver License John Doe ABC123 Expires 2025-12-31"
 */
async function extractImageWithAI(imagePath, mimeType) {
  try {
    // Read image file and convert to base64 for OpenAI API
    const imageBytes = fs.readFileSync(imagePath);
    const base64Image = imageBytes.toString('base64');

    // PASS 1: Extract raw text content using vision model
    // This ensures we capture all readable text without losing any information
    const textResponse = await openai.chat.completions.create({
      model: "gpt-5", // Latest model with enhanced vision capabilities
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Extract all text content from this image. Return only the extracted text without any formatting or additional commentary."
            },
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${base64Image}`
              }
            }
          ],
        },
      ],
    });

    // Extract raw text from the response
    const rawText = textResponse.choices[0].message.content || "";

    // PASS 2: Extract structured data using intelligent parsing
    // This identifies and organizes key information like names, dates, IDs, etc.
    const structuredResponse = await openai.chat.completions.create({
      model: "gpt-5", // Use latest model for best structured extraction
      messages: [
        {
          role: "system",
          content: "You are an expert at extracting structured information from images. Analyze the image and extract any structured information such as names, titles, positions, dates, addresses, phone numbers, emails, company/organization names, ID numbers, reference numbers, and any other structured data. Return the result as a JSON object with clear key-value pairs. If no structured data is found, return an empty object."
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Analyze this image and extract structured information:"
            },
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${base64Image}`
              }
            }
          ],
        },
      ],
      response_format: { type: "json_object" },
    });

    let structuredData = {};
    try {
      const structuredText = structuredResponse.choices[0].message.content;
      if (structuredText) {
        structuredData = JSON.parse(structuredText);
      }
    } catch (parseError) {
      console.warn('Failed to parse structured data JSON:', parseError);
      structuredData = {};
    }

    return {
      structuredData,
      rawText,
    };
  } catch (error) {
    // Enhanced error handling for image AI extraction using structured error detection
    console.error('Image AI extraction error:', error);
    
    // Handle OpenAI SDK errors using structured properties when available
    if (error && typeof error === 'object') {
      // Check for structured error properties first
      if (error.status === 429 || error.type === 'insufficient_quota') {
        throw new Error('AI service quota exceeded for image processing. Please check your OpenAI account limits.');
      }
      
      if (error.status === 400 || error.type === 'invalid_request_error') {
        throw new Error('Invalid image format for AI processing. Please ensure the image is clear and readable.');
      }
    }
    
    // Re-throw with context for upstream error handling
    const errorMessage = (error && error.message) ? error.message : String(error);
    throw new Error(`AI image extraction failed: ${errorMessage}`);
  }
}

/**
 * Extracts structured data from raw text using OpenAI's language models
 * 
 * This function takes pre-extracted text (typically from PDF documents) and
 * applies AI-powered analysis to identify and organize structured information.
 * It's optimized for text-based documents where visual layout isn't critical.
 * 
 * @private
 * @param {string} text - Raw text content to analyze
 * @returns {Promise<{structuredData: Object, rawText: string}>} Parsed structured data and original text
 * @throws {Error} When AI processing fails or API quota is exceeded
 * 
 * @example
 * const text = "John Doe\nSoftware Engineer\njohn.doe@company.com\n555-123-4567";
 * const result = await extractTextWithAI(text);
 * // result.structuredData = { "Name": "John Doe", "Role": "Software Engineer", "Email": "john.doe@company.com" }
 * // result.rawText = "John Doe\nSoftware Engineer\njohn.doe@company.com\n555-123-4567"
 */
async function extractTextWithAI(text) {
  try {
    // Process text through OpenAI's language model for structured data extraction
    const response = await openai.chat.completions.create({
      model: "gpt-5", // Latest model with enhanced text understanding
      messages: [
        {
          role: "system",
          content: "You are an expert at extracting structured information from text. Analyze the text and extract any structured information such as names, titles, positions, dates, addresses, phone numbers, emails, company/organization names, ID numbers, reference numbers, and any other structured data. Return the result as a JSON object with clear key-value pairs. If no structured data is found, return an empty object."
        },
        {
          role: "user",
          content: `Text to analyze:\n${text}`
        },
      ],
      response_format: { type: "json_object" }, // Force JSON format for consistent parsing
    });

    // Parse and validate the structured response
    let structuredData = {};
    try {
      const structuredText = response.choices[0].message.content;
      if (structuredText) {
        structuredData = JSON.parse(structuredText);
      }
    } catch (parseError) {
      // Graceful handling of JSON parsing errors - continue with empty object
      console.warn('Failed to parse structured data JSON:', parseError);
      structuredData = {};
    }

    // Return combined results for comprehensive text analysis
    return {
      structuredData, // AI-extracted structured information
      rawText: text,  // Original input text for reference
    };
  } catch (error) {
    // Enhanced error handling for text AI extraction using structured error detection
    console.error('Text AI extraction error:', error);
    
    // Handle OpenAI SDK errors using structured properties when available
    if (error && typeof error === 'object') {
      // Check for structured error properties first
      if (error.status === 429 || error.type === 'insufficient_quota') {
        throw new Error('AI service quota exceeded for text processing. Please check your OpenAI account limits.');
      }
      
      if (error.status === 400 && (error.code === 'context_length_exceeded' || error.type === 'invalid_request_error')) {
        throw new Error('Text content too large for AI processing. Please try with a smaller document.');
      }
    }
    
    // Re-throw with context for upstream error handling
    const errorMessage = (error && error.message) ? error.message : String(error);
    throw new Error(`AI text extraction failed: ${errorMessage}`);
  }
}