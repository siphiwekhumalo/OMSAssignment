import fs from "fs";
import OpenAI from "openai";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function extractWithOpenAI(filePath, mimeType) {
  try {
    if (mimeType === 'application/pdf') {
      // For PDFs, we need to extract text first and then process with AI
      // Since OpenAI can't directly process PDFs, we'll use standard extraction first
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
    console.error('OpenAI extraction error:', error);
    throw new Error(`AI extraction failed: ${error instanceof Error ? error.message : String(error)}`);
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