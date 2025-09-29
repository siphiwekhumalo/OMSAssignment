import fs from "fs";
import OpenAI from "openai";

// Initialize OpenAI client only if API key is present
const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

export async function extractWithOpenAI(filePath, mimeType) {
  if (!openai) {
    throw new Error("OpenAI API key not set. AI extraction is disabled. Set OPENAI_API_KEY to enable this feature.");
  }
  try {
    switch (true) {
      case mimeType === 'application/pdf':
        const extractedText = await extractPDFText(filePath);
        return await extractTextWithAI(extractedText);
      case mimeType.startsWith('image/'):
        return await extractImageWithAI(filePath, mimeType);
      default:
        throw new Error(`Unsupported file type for AI extraction: ${mimeType}`);
    }
  } catch (error) {
    handleOpenAIExtractionError(error);
  }
}

function handleOpenAIExtractionError(error) {
  console.error('OpenAI extraction error:', error);

  if (error && typeof error === 'object') {
    if (error.status || error.type || error.code) {
      if (error.status === 429 || error.type === 'insufficient_quota' || error.code === 'rate_limit_exceeded') {
        throw new Error('AI service quota exceeded. Please check your OpenAI account usage limits or try using Standard Extraction instead.');
      }
      if (error.status === 401 || error.type === 'invalid_request_error' || error.code === 'invalid_api_key') {
        throw new Error('AI service authentication failed. Please check your OpenAI API key configuration.');
      }
      if (error.status >= 500) {
        throw new Error('AI service temporarily unavailable. Please try Standard Extraction or try again later.');
      }
    }
    const errorMessage = error.message || String(error);
    throw new Error(`AI extraction failed: ${errorMessage}. Try using Standard Extraction as an alternative.`);
  }
  throw new Error(`AI extraction failed: ${String(error)}. Try using Standard Extraction as an alternative.`);
}

async function extractPDFText(filePath) {
  try {
    console.log('AI: Attempting PDF text extraction from:', filePath);
    
    const pdfBuffer = fs.readFileSync(filePath);
    console.log('AI: PDF buffer size:', pdfBuffer.length, 'bytes');
    
    // Import pdfjs-dist legacy build optimized for Node.js environments
    const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
    
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(pdfBuffer),
      useSystemFonts: true,
    });
    
    const pdfDocument = await loadingTask.promise;
    console.log('AI: PDF loaded successfully, pages:', pdfDocument.numPages);
    
    let extractedText = '';

    for (let pageNum = 1; pageNum <= pdfDocument.numPages; pageNum++) {
      try {
        const page = await pdfDocument.getPage(pageNum);
        const textContent = await page.getTextContent();
        
        // Combine individual text items into coherent page text
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
    
    extractedText = extractedText.trim();
    
    // Validate we extracted meaningful content
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
    // Read image file and convert to base64 for OpenAI API
    const imageBytes = fs.readFileSync(imagePath);
    const base64Image = imageBytes.toString('base64');
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
    if (error && typeof error === 'object') {
      if (error.status === 429 || error.type === 'insufficient_quota') {
        throw new Error('AI service quota exceeded for image processing. Please check your OpenAI account limits.');
      }
      
      if (error.status === 400 || error.type === 'invalid_request_error') {
        throw new Error('Invalid image format for AI processing. Please ensure the image is clear and readable.');
      }
    }
    
    const errorMessage = (error && error.message) ? error.message : String(error);
    throw new Error(`AI image extraction failed: ${errorMessage}`);
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
    
    if (error && typeof error === 'object') {
      if (error.status === 429 || error.type === 'insufficient_quota') {
        throw new Error('AI service quota exceeded for text processing. Please check your OpenAI account limits.');
      }
      
      if (error.status === 400 && (error.code === 'context_length_exceeded' || error.type === 'invalid_request_error')) {
        throw new Error('Text content too large for AI processing. Please try with a smaller document.');
      }
    }
    
    const errorMessage = (error && error.message) ? error.message : String(error);
    throw new Error(`AI text extraction failed: ${errorMessage}`);
  }
}