import { createWorker } from 'tesseract.js';
import fs from 'fs/promises';
import path from 'path';

export async function extractTextFromDocument(filePath, mimeType) {
  try {
    if (mimeType === 'application/pdf') {
      return await extractTextFromPDF(filePath);
    } else if (mimeType.startsWith('image/')) {
      return await extractTextFromImage(filePath);
    } else {
      throw new Error(`Unsupported file type: ${mimeType}`);
    }
  } catch (error) {
    console.error('Text extraction error:', error);
    throw new Error(`Failed to extract text: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function extractTextFromPDF(filePath) {
  try {
    console.log('Attempting PDF extraction from:', filePath);
    const pdfBuffer = await fs.readFile(filePath);
    console.log('PDF buffer size:', pdfBuffer.length, 'bytes');
    
    // Import pdf-parse with better error handling
    const pdfParseModule = await import('pdf-parse').catch(error => {
      console.error('pdf-parse import failed:', error);
      return null;
    });
    
    if (!pdfParseModule) {
      throw new Error('PDF parsing library not available');
    }
    
    const pdfParse = pdfParseModule.default || pdfParseModule;
    
    // Parse the PDF with basic options
    const data = await pdfParse(pdfBuffer).catch(parseError => {
      console.error('PDF parsing failed:', parseError);
      throw new Error(`PDF parsing failed: ${parseError.message}`);
    });
    
    console.log('PDF parsing successful, text length:', data.text?.length || 0);
    
    if (!data.text || data.text.trim().length === 0) {
      throw new Error('No text content found in PDF');
    }
    
    return data.text.trim();
  } catch (error) {
    console.error('PDF extraction error:', error);
    throw new Error(`Failed to extract text from PDF: ${error.message}`);
  }
}

async function extractTextFromImage(filePath) {
  let worker = null;
  
  try {
    worker = await createWorker('eng');
    const { data: { text } } = await worker.recognize(filePath);
    return text.trim();
  } catch (error) {
    console.error('OCR extraction error:', error);
    throw new Error('Failed to extract text from image using OCR');
  } finally {
    if (worker) {
      await worker.terminate();
    }
  }
}