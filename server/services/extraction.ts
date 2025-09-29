import { createWorker } from 'tesseract.js';
import * as pdfParse from 'pdf-parse';
import fs from 'fs/promises';
import path from 'path';

export async function extractTextFromDocument(filePath: string, mimeType: string): Promise<string> {
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

async function extractTextFromPDF(filePath: string): Promise<string> {
  try {
    const pdfBuffer = await fs.readFile(filePath);
    const data = await pdfParse(pdfBuffer);
    return data.text.trim();
  } catch (error) {
    console.error('PDF extraction error:', error);
    throw new Error('Failed to extract text from PDF');
  }
}

async function extractTextFromImage(filePath: string): Promise<string> {
  let worker: Tesseract.Worker | null = null;
  
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
