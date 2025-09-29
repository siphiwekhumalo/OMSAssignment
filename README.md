# Document Processing Tool

Extract text from PDF documents and images using OCR or AI-powered extraction.

## Features

- **Standard Extraction**: OCR (Tesseract.js) and PDF parsing
- **AI Extraction**: OpenAI GPT-5 with structured data parsing
- **File Support**: PDF, JPG, JPEG, PNG (max 10MB)
- **Side-by-Side Comparison**: Compare both extraction methods

## Quick Start

```bash
# Install dependencies
npm install

# Add OpenAI API key (optional - for AI features)
echo "OPENAI_API_KEY=your-key-here" > .env

# Start the application
npm run dev
```

Open http://localhost:5000

## Usage

1. Upload a document (PDF or image)
2. Fill in your information
3. Choose Standard or AI extraction
4. View results side-by-side

## API Key

Get your OpenAI API key from [platform.openai.com](https://platform.openai.com/api-keys).

Without it, only Standard Extraction will work.

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server

## Docker

```bash
docker-compose up -d
```

---

That's it! Process documents locally with zero database setup required.