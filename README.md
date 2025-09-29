# Document Processing Application

A full-stack web application for extracting text from PDF documents and images using both standard OCR methods and AI-powered extraction with OpenAI's GPT models.

## Features

- **Dual Processing Methods**: 
  - Standard extraction using OCR (Tesseract.js) and PDF parsing (pdfjs-dist)
  - AI-powered extraction using OpenAI GPT-5 with structured data parsing
- **File Support**: PDF, JPG, JPEG, and PNG files up to 10MB
- **Side-by-Side Comparison**: Compare results from both extraction methods
- **User-Friendly Interface**: Modern React frontend with form validation
- **Comprehensive Error Handling**: Smart quota detection with fallback suggestions
- **Production Ready**: Docker configuration and PostgreSQL database

## Prerequisites

- **Node.js** 20+ (recommended: use the latest LTS version)
- **npm** or **yarn** package manager
- **PostgreSQL** database (local installation or cloud service)
- **OpenAI API Key** (required for AI-powered extraction)

## Quick Start

### 1. Clone and Install

```bash
git clone <your-repository-url>
cd document-processing-app
npm install
```

### 2. Environment Setup

Copy the example environment file and configure your settings:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/docprocessor

# Session Security
SESSION_SECRET=your-very-secure-session-secret-key-here

# AI Services (OpenAI required)
OPENAI_API_KEY=your-openai-api-key-here
GEMINI_API_KEY=your-gemini-api-key-here  # Optional

# Development
NODE_ENV=development
```

### 3. Database Setup

**Option A: Local PostgreSQL**
1. Install PostgreSQL on your system
2. Create a database: `createdb docprocessor`
3. Update the `DATABASE_URL` in your `.env` file
4. Push the schema: `npm run db:push`

**Option B: Cloud Database (Recommended)**
1. Sign up for a cloud PostgreSQL service (Neon, Supabase, etc.)
2. Copy your connection string to `DATABASE_URL` in `.env`
3. Push the schema: `npm run db:push`

### 4. Get API Keys

**OpenAI API Key (Required for AI features):**
1. Visit [OpenAI Platform](https://platform.openai.com/)
2. Sign up/login and navigate to API Keys
3. Create a new secret key
4. Add it to your `.env` file as `OPENAI_API_KEY`

**Note**: Without an OpenAI API key, only Standard Extraction will work.

### 5. Start Development Server

```bash
npm run dev
```

The application will start on:
- **Frontend**: http://localhost:5000
- **Backend API**: http://localhost:5000/api

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm run check` | Run TypeScript type checking |
| `npm run db:push` | Push database schema changes |

## Project Structure

```
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components (Upload, Results)
│   │   └── lib/           # Utilities and configurations
├── server/                 # Express backend
│   ├── services/          # Business logic (extraction, AI)
│   ├── index.ts           # Server entry point
│   ├── routes.js          # API endpoints
│   └── storage.js         # Database interface
├── shared/                 # Shared types and schemas
│   └── schema.js          # Zod validation schemas
├── uploads/               # File upload directory
├── package.json           # Dependencies and scripts
├── drizzle.config.ts      # Database configuration
└── docker-compose.yml     # Docker setup (optional)
```

## Usage

1. **Upload Document**: Navigate to the home page and upload a PDF or image file
2. **Fill Information**: Provide your personal information (First Name, Last Name, Date of Birth)
3. **Choose Method**: Select Standard Extraction or AI Extraction
4. **Process**: Click "Process Document" to extract text
5. **View Results**: Review extracted text and structured data side-by-side

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/process-document` | POST | Upload and process document |
| `/api/processed-documents` | GET | List all processed documents |
| `/api/processed-documents/:id` | GET | Get specific document |
| `/health` | GET | Health check endpoint |

## Development

### Adding New Features

1. **Frontend Components**: Add to `client/src/components/`
2. **New Pages**: Add to `client/src/pages/` and register in `client/src/App.tsx`
3. **API Routes**: Add to `server/routes.js`
4. **Database Models**: Update `shared/schema.js` and run `npm run db:push`

### Code Style

- **TypeScript**: Strongly typed throughout
- **Modern JavaScript**: ES modules, async/await
- **React Patterns**: Hooks, functional components
- **Validation**: Zod schemas for type-safe validation
- **UI Components**: Shadcn/ui with Tailwind CSS

## Troubleshooting

### Common Issues

**1. Database Connection Failed**
```bash
# Check your DATABASE_URL format
# PostgreSQL format: postgresql://user:password@host:port/database
```

**2. OpenAI Quota Exceeded**
- The app gracefully handles quota limits
- Users are directed to use Standard Extraction instead
- Check your OpenAI account billing and usage

**3. File Upload Errors**
- Maximum file size: 10MB
- Supported formats: PDF, JPG, JPEG, PNG
- Check file permissions in the `uploads/` directory

**4. Development Server Won't Start**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Check Node.js version
node --version  # Should be 20+
```

**5. Build Errors**
```bash
# Run type checking
npm run check

# Clear build cache
rm -rf client/dist dist/
npm run build
```

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `SESSION_SECRET` | Yes | Secret key for session encryption |
| `OPENAI_API_KEY` | Recommended | OpenAI API key for AI features |
| `NODE_ENV` | No | Environment (development/production) |
| `GEMINI_API_KEY` | No | Google Gemini API key (future use) |

### Getting Help

1. **Check Logs**: Development server shows detailed error messages
2. **Database Issues**: Verify your `DATABASE_URL` connection
3. **API Issues**: Test with `curl http://localhost:5000/health`
4. **Build Problems**: Run `npm run check` for TypeScript errors

## Production Deployment

### Option 1: Docker (Recommended)

```bash
# Start with Docker Compose
docker-compose up -d

# Initialize database
docker-compose exec app npm run db:push
```

See `README.docker.md` for detailed Docker instructions.

### Option 2: Manual Deployment

1. Build the application: `npm run build`
2. Set production environment variables
3. Start with: `npm start`
4. Use a process manager like PM2 for production

## License

MIT License - see LICENSE file for details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

---

For Docker deployment instructions, see [README.docker.md](./README.docker.md)