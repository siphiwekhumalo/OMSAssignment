# Document Processing Application

## Overview

This is a full-stack web application for processing and extracting data from documents (PDFs and images). The application offers two processing methods: standard text extraction using OCR/PDF parsing, and AI-powered extraction using OpenAI's GPT models. Built with React frontend, Express backend, and PostgreSQL database using Drizzle ORM.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **UI Library**: Shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design system variables
- **State Management**: TanStack Query for server state management
- **Form Handling**: React Hook Form with Zod validation
- **File Structure**: Component-based architecture with shared utilities

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Design**: RESTful endpoints with file upload support
- **File Processing**: Multer for multipart form handling with 10MB file size limit
- **Error Handling**: Centralized error middleware with structured error responses
- **Development**: Hot reload with tsx for TypeScript execution

### Data Storage
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Schema**: User management and document processing tables with UUID primary keys
- **Migrations**: Drizzle Kit for schema management and migrations
- **Fallback Storage**: In-memory storage class for development/testing scenarios
- **Session Management**: PostgreSQL session store with connect-pg-simple

### Authentication & Authorization
- **Session-based Authentication**: Cookie-based sessions stored in PostgreSQL
- **User Management**: Username/password authentication with hashed passwords
- **API Security**: Credential-based requests with CORS handling

### Document Processing Pipeline
- **Standard Processing**: 
  - PDF text extraction using pdf-parse library
  - Image OCR using Tesseract.js for text recognition
- **AI Processing**:
  - OpenAI GPT-5 integration for intelligent data extraction
  - Structured data extraction with JSON responses
  - Image analysis capabilities for document understanding
- **File Support**: PDF, JPEG, JPG, and PNG file formats
- **Processing Metrics**: Performance tracking with processing time measurement

## External Dependencies

### Core Services
- **Neon Database**: PostgreSQL database hosting (@neondatabase/serverless)
- **OpenAI API**: GPT-5 model for AI-powered document processing
- **Google Generative AI**: Alternative AI service integration

### Document Processing Libraries
- **Tesseract.js**: OCR engine for image text extraction
- **pdf-parse**: PDF document text parsing
- **Multer**: File upload middleware for Express

### UI and Styling
- **Radix UI**: Unstyled, accessible UI primitives
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Icon library for consistent iconography
- **class-variance-authority**: Type-safe variant API for components

### Development Tools
- **Drizzle Kit**: Database schema management and migrations
- **Vite**: Frontend build tool with hot module replacement
- **TypeScript**: Static type checking across the stack
- **ESBuild**: Fast JavaScript bundler for production builds

### Replit Integration
- **Replit Plugins**: Development banner, cartographer, and runtime error modal
- **Environment**: Configured for Replit hosting with proper asset handling