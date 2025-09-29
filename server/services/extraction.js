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
    
    // Import pdfjs-dist for reliable PDF text extraction
    const pdfjsLib = await import('pdfjs-dist');
    
    // Load the PDF document
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(pdfBuffer),
      useSystemFonts: true,
    });
    
    const pdfDocument = await loadingTask.promise;
    console.log('PDF loaded successfully, pages:', pdfDocument.numPages);
    
    let extractedText = '';
    
    // Extract text from all pages
    for (let pageNum = 1; pageNum <= pdfDocument.numPages; pageNum++) {
      try {
        const page = await pdfDocument.getPage(pageNum);
        const textContent = await page.getTextContent();
        
        // Combine text items from the page
        const pageText = textContent.items
          .map(item => item.str)
          .join(' ');
        
        if (pageText.trim()) {
          extractedText += `\n--- Page ${pageNum} ---\n${pageText}\n`;
        }
      } catch (pageError) {
        console.error(`Error extracting text from page ${pageNum}:`, pageError);
        extractedText += `\n--- Page ${pageNum} ---\n[Error extracting text from this page]\n`;
      }
    }
    
    // Clean up the extracted text
    extractedText = extractedText.trim();
    
    if (!extractedText || extractedText.length === 0) {
      throw new Error('No text content found in PDF document');
    }
    
    console.log('PDF text extraction successful, text length:', extractedText.length, 'characters');
    return extractedText;
    
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