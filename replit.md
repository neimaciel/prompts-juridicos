# Prompts Jurídicos Ampliados

## Overview
This is a full-stack web application designed for generating legal prompts leveraging AI, specifically tailored for the Brazilian legal system. The platform offers an intuitive interface for users to request legal document creation, incorporating AI-powered analysis and a sophisticated quality scoring system. The project aims to streamline legal document drafting, enhance efficiency for legal professionals, and become a leading tool in legal tech.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions
The frontend employs React 18 with TypeScript, styled using Tailwind CSS and Radix UI components via shadcn/ui. Animations are handled by Framer Motion for a smooth user experience. The design adheres to a professional blue-indigo-slate color scheme, removing all purple/pink elements to ensure visual consistency and a professional appearance. Key UI enhancements include a redesigned quality analysis tab with modern card layouts, improved circular progress indicators, and enhanced typography. A user rating system with emoji-based feedback and a dynamic weekly suggestion system are integrated for improved user engagement and content relevance.

### Technical Implementations
The application features a robust backend built with Node.js and Express.js, using PostgreSQL with Drizzle ORM (hosted on Neon Database). AI integration supports multiple providers including Anthropic Claude, OpenAI, and Google Gemini, with a fallback system for resilience. Key features include intelligent document type detection for various legal documents (Contracts, Petitions, Legal Opinions, Genealogical Research, Labor Documents, Notifications) which dynamically adjusts AI scoring criteria based on detected type. Security features encompass LGPD compliance with sensitive data detection (CPF, CNPJ, addresses), rate limiting, and input validation. The system also supports PDF and Word document export. An intelligent scoring system with a score preview feature provides real-time feedback on prompt quality. User authentication supports both email/password and Google OAuth, integrated with a token-based economy for AI operations and subscription plans managed via Stripe.

### Feature Specifications
- **AI-Powered Legal Prompt Generation**: Specializes in Brazilian legal context.
- **Multi-AI Provider Support**: Integrates Claude, OpenAI, and Gemini with a fallback mechanism.
- **Adaptive Quality Scoring**: Context-aware analysis adjusting to 6 distinct legal document types, preventing unfair evaluation of specialized content.
- **LGPD Compliance**: Automatic detection and blocking of sensitive personal data.
- **Document Export**: Capabilities for exporting generated prompts to PDF and Word formats.
- **User Management & Token Economy**: Authentication, user role management, and a token-based system for accessing AI features, integrated with Stripe for payments and subscriptions.
- **Collaborative Quality Improvement**: Users can select, customize, and edit AI-generated and system suggestions with real-time quality metric updates.
- **Dynamic Content Suggestions**: Weekly updated suggestions for document types based on platform usage.
- **Weekly User Satisfaction Survey**: Intelligent feedback collection system that appears once per week after users view prompt cards, featuring satisfaction and usage frequency sliders with optional suggestions. Supports both authenticated users and anonymous visitors through browser fingerprinting with 7-day cooldown enforcement.

### System Design Choices
The system prioritizes a modular architecture, separating frontend and backend concerns. React and Vite provide a fast and efficient frontend development and build process. Node.js with Express.js offers a scalable backend. PostgreSQL with Drizzle ORM ensures robust data persistence. The intelligent scoring mechanism is fundamental, ensuring relevant and accurate feedback for legal prompts. The application emphasizes security, user experience, and a clear, professional aesthetic.

## External Dependencies

### AI Services
- **Anthropic Claude**: Primary AI provider.
- **OpenAI**: Alternative AI provider.
- **Google Gemini**: Additional AI provider for analysis tasks.

### Infrastructure
- **Neon Database**: Serverless PostgreSQL hosting.
- **Replit**: Development and deployment platform.

### Frontend Libraries
- **React**: Frontend framework.
- **Tailwind CSS**: Utility-first CSS framework.
- **Radix UI**: Accessible component primitives.
- **shadcn/ui**: Component system built on Radix UI.
- **TanStack Query**: Server state management.
- **Framer Motion**: Animation library.
- **Wouter**: Lightweight client-side routing.

### Backend Libraries
- **Express.js**: Web application framework for Node.js.
- **Drizzle ORM**: TypeScript ORM for PostgreSQL.
- **bcrypt**: Password hashing.
- **jsonwebtoken**: For JWT authentication.

### Third-Party Integrations
- **Stripe**: Payment processing and subscription management.
- **jsPDF**: Client-side PDF generation.
- **docx**: Microsoft Word document generation.
- **mammoth**: For DOCX parsing.
- **pdf-parse**: For PDF parsing.
- **Google Analytics (GA4)**: Web analytics service.
- **Microsoft Clarity**: User behavior analytics.