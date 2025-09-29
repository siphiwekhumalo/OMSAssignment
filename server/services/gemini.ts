import * as fs from "fs";
import { GoogleGenerativeAI } from "@google/generative-ai";

// This API key is from Gemini Developer API Key, not vertex AI API Key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

interface ExtractedData {
  structuredData: Record<string, any>;
  rawText: string;
}

export async function extractWithGemini(filePath: string, mimeType: string): Promise<ExtractedData> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
    
    if (mimeType === 'application/pdf') {
      // For PDFs, we need to extract text first and then process with AI
      // Since Gemini can't directly process PDFs, we'll use standard extraction first
      const pdfParse = require('pdf-parse');
      const pdfBuffer = fs.readFileSync(filePath);
      const data = await pdfParse(pdfBuffer);
      return await extractTextWithAI(data.text);
    } else if (mimeType.startsWith('image/')) {
      return await extractImageWithAI(filePath, mimeType);
    } else {
      throw new Error(`Unsupported file type for AI extraction: ${mimeType}`);
    }
  } catch (error) {
    console.error('Gemini extraction error:', error);
    throw new Error(`AI extraction failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function extractImageWithAI(imagePath: string, mimeType: string): Promise<ExtractedData> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
    
    const imageBytes = fs.readFileSync(imagePath);
    const imagePart = {
      inlineData: {
        data: imageBytes.toString('base64'),
        mimeType: mimeType,
      },
    };

    // First, extract raw text
    const textPrompt = "Extract all text content from this image. Return only the extracted text without any formatting or additional commentary.";
    
    const textResult = await model.generateContent([textPrompt, imagePart]);
    const rawText = textResult.response.text() || "";

    // Then, extract structured data
    const structuredPrompt = `Analyze this image and extract any structured information you can identify such as:
- Names, titles, positions
- Dates, addresses, phone numbers, emails  
- Company/organization names
- ID numbers, reference numbers
- Any other structured data

Return the result as a JSON object with clear key-value pairs. If no structured data is found, return an empty object.`;

    const structuredResult = await model.generateContent({
      contents: [{
        role: 'user',
        parts: [{ text: structuredPrompt }, imagePart]
      }],
      generationConfig: {
        responseMimeType: "application/json",
      },
    });

    let structuredData = {};
    try {
      const structuredText = structuredResult.response.text();
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
    console.error('Image AI extraction error:', error);
    throw error;
  }
}

async function extractTextWithAI(text: string): Promise<ExtractedData> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

    // Extract structured data from the text
    const structuredPrompt = `Analyze the following text and extract any structured information you can identify such as:
- Names, titles, positions
- Dates, addresses, phone numbers, emails
- Company/organization names  
- ID numbers, reference numbers
- Any other structured data

Text to analyze:
${text}

Return the result as a JSON object with clear key-value pairs. If no structured data is found, return an empty object.`;

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: structuredPrompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
      },
    });

    let structuredData = {};
    try {
      const structuredText = result.response.text();
      if (structuredText) {
        structuredData = JSON.parse(structuredText);
      }
    } catch (parseError) {
      console.warn('Failed to parse structured data JSON:', parseError);
      structuredData = {};
    }

    return {
      structuredData,
      rawText: text,
    };
  } catch (error) {
    console.error('Text AI extraction error:', error);
    throw error;
  }
}
