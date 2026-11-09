# Backend – AI Interview Questions Generator

The backend provides a REST API for generating tailored technical and behavioral interview questions using Google's Gemini API.

It is built with Node.js, TypeScript, Fastify and PostgreSQL, with Prisma ORM handling database access and migrations.

## Table of Contents

- [Overview](#overview)
- [Technology Stack](#technology-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [Running the Server](#running-the-server)
- [API Reference](#api-reference)
- [Gemini Integration](#gemini-integration)
- [Error Handling](#error-handling)
- [Security](#security)
- [Testing](#testing)
- [Available Scripts](#available-scripts)

## Overview

The backend accepts job information and candidate experience levels, sends a structured request to Gemini, validates the generated questions and stores the results in PostgreSQL.

Each generated question includes:

- Interview question.
- Skill or competency category.
- Difficulty level.
- Evaluation criteria.

The application also records available AI token usage and generation latency.

## Technology Stack

| Technology | Purpose |
|---|---|
| Node.js | JavaScript runtime |
| TypeScript | Type-safe development |
| Fastify | REST API framework |
| PostgreSQL | Relational database |
| Prisma ORM | Database access and migrations |
| Google Gemini API | AI question generation |
| `@google/genai` | Gemini SDK |
| Zod | Request and response validation |
| Vitest | Automated testing |
| Helmet | HTTP security headers |
| CORS | Cross-origin configuration |
| Fastify Rate Limit | Request rate limiting |

## Architecture

The backend uses a modular architecture.

```text
Client
  |
  v
Fastify REST API
  |
  +---- Routes
  |
  +---- Schemas (Zod)
  |
  v
Interview Service
  |
  +---- Gemini Integration
  |        |
  |        v
  |     Gemini API
  |
  +---- Repository
           |
           v
       Prisma ORM
           |
           v
       PostgreSQL
```

The separation of responsibilities makes the application easier to maintain, test and extend.

## Project Structure

```text
backend/
├── prisma/
│   ├── migrations/
│   └── schema.prisma
│
├── src/
│   ├── config/
│   │   └── env.ts
│   │
│   ├── db/
│   │   └── prisma.ts
│   │
│   ├── integrations/
│   │   └── gemini/
│   │       ├── gemini.client.ts
│   │       ├── gemini.errors.ts
│   │       └── gemini.schema.ts
│   │
│   ├── repositories/
│   │   └── interview.repository.ts
│   │
│   ├── routes/
│   │   ├── health.routes.ts
│   │   └── interview.routes.ts
│   │
│   ├── schemas/
│   │   └── interview.schema.ts
│   │
│   ├── services/
│   │   └── interview.service.ts
│   │
│   ├── app.ts
│   └── server.ts
│
├── tests/
│   ├── gemini.integration.test.ts
│   └── interview.routes.test.ts
│
├── .env.example
├── .gitignore
├── package.json
└── tsconfig.json
```

## Prerequisites

Install:

- Node.js 24 or a compatible modern version.
- npm.
- PostgreSQL 16 or compatible.
- Git.
- A Google Gemini API key.

## Getting Started

### 1. Navigate to the backend

```bash
cd backend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

```bash
cp .env.example .env
```

Open `.env` and configure your PostgreSQL connection and Gemini API key.

See [Environment Variables](#environment-variables).

### 4. Generate Prisma Client

```bash
npx prisma generate
```

### 5. Run database migrations

For local development:

```bash
npx prisma migrate dev
```

### 6. Start the development server

```bash
npm run dev
```

The API will be available at:

`http://localhost:5000`

## Environment Variables

Create a `.env` file in the backend directory.

Example configuration:

```env
NODE_ENV=development
PORT=5000

DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/interview_generator?schema=public

GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=your_configured_gemini_model

FRONTEND_URL=http://localhost:3000
```

| Variable | Description |
|---|---|
| `NODE_ENV` | Application environment |
| `PORT` | API server port |
| `DATABASE_URL` | PostgreSQL connection string |
| `GEMINI_API_KEY` | Gemini API credential |
| `GEMINI_MODEL` | Gemini model identifier |
| `FRONTEND_URL` | Permitted frontend origin |

Never commit `.env` files or expose provider credentials in frontend code.

## Database Setup

The application uses PostgreSQL with Prisma ORM.

The database currently contains three primary models:

### Generation

Stores interview generation requests, including job title, job description, experience level, interview type, provider, model and generation status.

### GeneratedQuestion

Stores the generated questions, their categories, difficulty levels and evaluation criteria.

### UsageRecord

Tracks provider usage information, including available input tokens, output tokens, total tokens, latency and provider request ID.

### Relationships

- One generation can contain multiple questions.
- One generation can have one usage record.
- Related records are persisted together using a database transaction.

To inspect the schema:

```bash
npx prisma studio
```

To create a development migration:

```bash
npx prisma migrate dev --name describe_your_change
```

## Running the Server

Development:

```bash
npm run dev
```

Production build:

```bash
npm run build
```

Start the compiled application:

```bash
npm start
```

## API Reference

All API endpoints use the `/api/v1` prefix.

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/v1/health` | API health check |
| GET | `/api/v1/ready` | Database readiness check |
| POST | `/api/v1/interviews/generate` | Generate interview questions |

### Health Check

```http
GET /api/v1/health
```

Checks whether the API is running.

### Readiness Check

```http
GET /api/v1/ready
```

Checks application and database readiness.

### Generate Interview Questions

```http
POST /api/v1/interviews/generate
Content-Type: application/json
```

Example request:

```json
{
  "jobTitle": "Junior Backend Developer",
  "jobDescription": "Looking for a developer with Node.js, REST APIs, PostgreSQL and API security experience.",
  "experienceLevel": "JUNIOR",
  "interviewType": "TECHNICAL",
  "questionCount": 3
}
```

### Request Fields

| Field | Type | Accepted values |
|---|---|---|
| `jobTitle` | String | 2–150 characters |
| `jobDescription` | String | 20–10,000 characters |
| `experienceLevel` | String | JUNIOR, MID, SENIOR |
| `interviewType` | String | TECHNICAL, BEHAVIORAL, MIXED |
| `questionCount` | Number | Integer from 1 to 20 |

A successful generation returns HTTP `201 Created`.

The response includes generation information, generated questions, evaluation criteria and available usage metadata.

### Error Responses

| Status | Meaning |
|---|---|
| 400 | Invalid request |
| 429 | Rate limit exceeded |
| 500 | Unexpected internal error |
| 502 | Provider error or invalid provider response |
| 503 | Provider unavailable or not configured |
| 504 | Provider request timeout |

The interview generation endpoint is configured for a limit of five requests per minute.

## Gemini Integration

The backend integrates with Google's Gemini API through the official `@google/genai` SDK.

The integration supports:

- Server-side API key management.
- Configurable model selection.
- Structured JSON generation.
- Response validation using Zod.
- Provider error classification.
- Retry handling for transient failures.
- Request timeout handling.
- Token usage extraction.
- Generation latency measurement.
- Provider request ID extraction where available.

The Gemini integration is separated from the HTTP routes and database layer to make it easier to maintain or replace the AI provider.

## Error Handling

Provider failures are classified into application-level errors.

Common scenarios include:

- Authentication failures.
- Rate limits.
- Request timeouts.
- Missing or unavailable models.
- Temporary provider outages.
- Invalid structured responses.

Internal implementation details and sensitive information should not be exposed in API error responses.

## Security

Security considerations implemented in the backend include:

- Environment variable validation.
- Backend-only Gemini API credentials.
- Helmet security headers.
- CORS origin configuration.
- Request body size limits.
- Global and endpoint-specific rate limiting.
- Strict request validation.
- Structured error handling.
- Sensitive header redaction in logs.
- Protection against exposing internal database errors.
- Provider request timeouts.
- Transactional database persistence.

Additional production hardening should include least-privilege database credentials, production secret management, monitoring and deployment-specific security configuration.

## Testing

Vitest is used for automated testing.

### Run the standard test suite

```bash
npm test
```

The real Gemini integration test is skipped by default.

### Run the Gemini integration test

```bash
npm run test:gemini
```

This requires a valid Gemini API key and internet access.

### Run tests in watch mode

```bash
npm run test:watch
```

### Build verification

```bash
npm run build
```

The test suite includes API route tests for validation, successful generation and error handling.

The Gemini integration test verifies real provider communication and structured question generation.

## Available Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Compile TypeScript |
| `npm start` | Start compiled server |
| `npm test` | Run automated tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:gemini` | Run real Gemini integration test |
| `npm run prisma:generate` | Generate Prisma Client |
| `npm run prisma:migrate` | Run development migrations |

---

**Backend development:** Christina Manga
**Project:** AI Interview Questions Generator
**Repository:** [GitHub](https://github.com/tinamanga/ai-interview-generator)