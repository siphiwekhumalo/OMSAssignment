# Docker Deployment Guide

This guide explains how to deploy the Document Processing Application using Docker and Docker Compose.

## Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- At least 2GB RAM available for containers
- OpenAI API key (required for AI processing features)

## Quick Start

1. **Clone and prepare environment**:
   ```bash
   git clone <your-repo-url>
   cd document-processing-app
   cp .env.example .env
   ```

2. **Configure environment variables**:
   Edit `.env` file with your configuration:
   ```bash
   # Required
   OPENAI_API_KEY=your-openai-api-key-here
   SESSION_SECRET=your-secure-session-secret
   DATABASE_PASSWORD=your-secure-database-password
   
   # Optional
   APP_PORT=3000
   DATABASE_NAME=docprocessor
   ```

3. **Start the application**:
   ```bash
   docker-compose up -d
   ```

4. **Initialize database schema**:
   ```bash
   docker-compose exec app npm run db:push
   ```

5. **Access the application**:
   - Open http://localhost:3000 in your browser
   - The application should be ready to process documents

## Configuration

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `OPENAI_API_KEY` | OpenAI API key for AI processing | - | Yes |
| `SESSION_SECRET` | Secret key for session encryption | - | Yes |
| `DATABASE_PASSWORD` | PostgreSQL password | postgres | Yes |
| `APP_PORT` | Application port on host | 3000 | No |
| `DATABASE_NAME` | PostgreSQL database name | docprocessor | No |
| `DATABASE_USER` | PostgreSQL username | postgres | No |
| `GEMINI_API_KEY` | Google Gemini API key (optional) | - | No |

### Volumes

- `postgres_data`: PostgreSQL data persistence
- `app_uploads`: Document uploads persistence
- `./uploads`: Host directory for uploaded files

## Management Commands

### Start Services
```bash
# Start in background
docker-compose up -d

# Start with logs
docker-compose up
```

### Stop Services
```bash
# Stop services
docker-compose down

# Stop and remove volumes (WARNING: destroys data)
docker-compose down -v
```

### Database Management
```bash
# Push schema changes
docker-compose exec app npm run db:push

# Access PostgreSQL
docker-compose exec postgres psql -U postgres -d docprocessor

# View database logs
docker-compose logs postgres
```

### Application Logs
```bash
# View application logs
docker-compose logs app

# Follow logs in real-time
docker-compose logs -f app
```

### Health Checks
```bash
# Check service status
docker-compose ps

# Test application health
curl http://localhost:3000/health
```

## Development with Docker

For development with hot reload:

```bash
# Override for development
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up
```

Create `docker-compose.dev.yml`:
```yaml
version: '3.8'
services:
  app:
    build:
      target: builder
    command: npm run dev
    volumes:
      - .:/app
      - /app/node_modules
    environment:
      - NODE_ENV=development
```

## Troubleshooting

### Common Issues

1. **Port already in use**:
   ```bash
   # Change APP_PORT in .env file
   APP_PORT=8080
   ```

2. **Database connection failed**:
   ```bash
   # Check database health
   docker-compose ps postgres
   docker-compose logs postgres
   ```

3. **Application crashes**:
   ```bash
   # Check application logs
   docker-compose logs app
   
   # Restart application
   docker-compose restart app
   ```

4. **Out of disk space**:
   ```bash
   # Clean up Docker resources
   docker system prune -a
   docker volume prune
   ```

### Performance Tuning

For production deployments:

1. **Resource Limits**: Add resource limits to `docker-compose.yml`
2. **Reverse Proxy**: Use Nginx or Traefik for SSL and load balancing
3. **Database Tuning**: Configure PostgreSQL for your workload
4. **Monitoring**: Add logging and monitoring services

## Security Considerations

- Always use strong passwords for database and session secrets
- Keep API keys secure and rotate them regularly
- Run containers with non-root users (already configured)
- Use a reverse proxy for SSL termination in production
- Regularly update base images for security patches

## Backup and Recovery

### Database Backup
```bash
# Create backup
docker-compose exec postgres pg_dump -U postgres docprocessor > backup.sql

# Restore backup
docker-compose exec -T postgres psql -U postgres docprocessor < backup.sql
```

### File Uploads Backup
```bash
# Backup uploads directory
tar -czf uploads-backup.tar.gz uploads/
```

## Production Deployment

For production, consider:

1. Using Docker Swarm or Kubernetes
2. External PostgreSQL database (AWS RDS, Google Cloud SQL)
3. Object storage for file uploads (AWS S3, Google Cloud Storage)
4. Container monitoring (Prometheus, Grafana)
5. Log aggregation (ELK Stack, Fluentd)
6. Automated backups and disaster recovery

## Support

For issues and questions:
- Check application logs: `docker-compose logs app`
- Review database health: `docker-compose ps`
- Ensure environment variables are set correctly
- Verify Docker and Docker Compose versions