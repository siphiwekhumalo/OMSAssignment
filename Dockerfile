# Multi-stage Docker build for Document Processing Application
# Stage 1: Build stage for frontend and backend
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files for dependency installation
COPY package*.json ./

# Install dependencies (including dev dependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Build the application (frontend with Vite + backend with esbuild)
RUN npm run build

# Stage 2: Production stage
FROM node:20-alpine AS production

# Install system dependencies needed for document processing
RUN apk add --no-cache \
    ghostscript \
    poppler-utils \
    imagemagick

# Create app user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S appuser -u 1001

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --omit=dev && npm cache clean --force

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/client/dist ./client/dist

# Create uploads directory and set permissions
RUN mkdir -p uploads server/uploads && \
    chown -R appuser:nodejs /app

# Switch to non-root user
USER appuser

# Expose the application port
EXPOSE 5000

# Health check to ensure application is running
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the application
CMD ["npm", "start"]