import fs from "fs";
import OpenAI from "openai";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function extractWithOpenAI(filePath, mimeType) {
  try {
    if (mimeType === 'application/pdf') {
      // For PDFs, we need to extract text first and then process with AI
      // Since OpenAI can't directly process PDFs, we'll use the working PDF extraction first
      const extractedText = await extractPDFText(filePath);
      return await extractTextWithAI(extractedText);
    } else if (mimeType.startsWith('image/')) {
      return await extractImageWithAI(filePath, mimeType);
    } else {
      throw new Error(`Unsupported file type for AI extraction: ${mimeType}`);
    }
  } catch (error) {
    console.error('OpenAI extraction error:', error);
    throw new Error(`AI extraction failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function extractPDFText(filePath) {
  try {
    console.log('AI: Attempting PDF text extraction from:', filePath);
    const pdfBuffer = fs.readFileSync(filePath);
    console.log('AI: PDF buffer size:', pdfBuffer.length, 'bytes');
    
    // Import pdfjs-dist legacy build for Node.js environments
    const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
    
    // Load the PDF document
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(pdfBuffer),
      useSystemFonts: true,
    });
    
    const pdfDocument = await loadingTask.promise;
    console.log('AI: PDF loaded successfully, pages:', pdfDocument.numPages);
    
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
          extractedText += `${pageText}\n`;
        }
      } catch (pageError) {
        console.error(`AI: Error extracting text from page ${pageNum}:`, pageError);
      }
    }
    
    // Clean up the extracted text
    extractedText = extractedText.trim();
    
    if (!extractedText || extractedText.length === 0) {
      throw new Error('No text content found in PDF document');
    }
    
    console.log('AI: PDF text extraction successful, text length:', extractedText.length, 'characters');
    return extractedText;
    
  } catch (error) {
    console.error('AI: PDF extraction error:', error);
    throw new Error(`Failed to extract text from PDF: ${error.message}`);
  }
}

async function extractImageWithAI(imagePath, mimeType) {
  try {
    const imageBytes = fs.readFileSync(imagePath);
    const base64Image = imageBytes.toString('base64');

    // First, extract raw text
    const textResponse = await openai.chat.completions.create({
      model: "gpt-5",
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

    const rawText = textResponse.choices[0].message.content || "";

    // Then, extract structured data
    const structuredResponse = await openai.chat.completions.create({
      model: "gpt-5",
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
    console.error('Image AI extraction error:', error);
    throw error;
  }
}

async function extractTextWithAI(text) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5",
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
      response_format: { type: "json_object" },
    });

    let structuredData = {};
    try {
      const structuredText = response.choices[0].message.content;
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