# Overview

This is a Turkish legal document management system designed for the Ankara Chief Prosecutor's Office. The application enables prosecutors to convert police information notes into structured judicial reports using AI analysis. The system provides a wizard-based interface for document processing, template management, and an archive for historical document storage.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **UI Library**: Radix UI components with shadcn/ui design system
- **Styling**: Tailwind CSS with custom design tokens for consistent theming
- **State Management**: TanStack Query for server state and React hooks for local state
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation

## Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Authentication**: Passport.js with local strategy using session-based auth
- **Session Storage**: PostgreSQL-backed sessions with connect-pg-simple
- **API Design**: RESTful endpoints with structured error handling
- **File Processing**: Multer for file uploads and docx library for document generation

## Database Layer
- **Database**: PostgreSQL with Neon serverless hosting
- **ORM**: Drizzle ORM for type-safe database operations
- **Schema**: Relational design with users, templates, and information_notes tables
- **Migrations**: Drizzle Kit for schema management and migrations

## AI Integration
- **Provider**: OpenAI API for text analysis and document generation
- **Model**: GPT-5 for analyzing police reports and extracting structured data
- **Processing**: Automatic categorization of reports into predefined judicial formats
- **Output**: Structured data extraction and intelligent document generation

## Authentication & Authorization
- **Method**: Registry number-based authentication with password hashing using Node.js crypto scrypt
- **Session Management**: Secure HTTP-only cookies with PostgreSQL session store
- **Role-Based Access**: Admin users have additional privileges for user and template management
- **Security**: CSRF protection and secure session configuration

## Document Processing Workflow
- **Input**: Police information notes pasted as text
- **Analysis**: AI categorizes content and extracts relevant legal information
- **Template Selection**: System suggests appropriate judicial document format
- **Form Completion**: Users fill in missing required information
- **Generation**: Automated creation of properly formatted judicial documents
- **Export Options**: Word document, PDF, or copyable text output

# External Dependencies

## Core Services
- **Neon Database**: PostgreSQL serverless database hosting with connection pooling
- **OpenAI API**: GPT-5 integration for document analysis and generation

## UI and Styling
- **Radix UI**: Comprehensive set of accessible React components
- **Tailwind CSS**: Utility-first CSS framework with custom design system
- **Lucide React**: Modern icon library for consistent iconography

## Development and Build Tools
- **Vite**: Fast build tool with HMR and optimized production builds
- **TypeScript**: Type safety across the entire application stack
- **Replit Integration**: Development environment plugins and error overlay

## Document and File Processing
- **docx**: Library for creating and manipulating Word documents
- **Multer**: Middleware for handling multipart/form-data file uploads
- **date-fns**: Date manipulation and formatting utilities

## Authentication and Security
- **Passport.js**: Authentication middleware with local strategy
- **connect-pg-simple**: PostgreSQL session store for Express sessions
- **Node.js crypto**: Built-in cryptographic functions for password hashing