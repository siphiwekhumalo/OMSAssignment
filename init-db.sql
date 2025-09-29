-- Database initialization script for Document Processing Application
-- This script sets up the initial database structure and configurations

-- Enable UUID extension for generating unique IDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create schema for application tables
CREATE SCHEMA IF NOT EXISTS public;

-- Set default permissions
GRANT ALL PRIVILEGES ON SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;

-- Note: Drizzle ORM will handle table creation through schema push
-- This file only sets up extensions and basic database configuration