# InterviewIQ – AI Interview Questions Generator

InterviewIQ is an AI-powered interview preparation application that generates tailored interview questions from a job title and job description.

Users can specify the candidate's experience level, interview type, and desired number of questions. The application uses Google's Gemini API to generate structured questions, including difficulty levels, categories, and evaluation criteria.

## Features

- Public landing page explaining the application.
- User registration and login.
- Refresh-token-based authentication sessions.
- Secure password hashing using Argon2.
- AI-generated interview questions using Google Gemini.
- Technical, behavioral, and mixed interview formats.
- Junior, mid-level, and senior experience levels.
- Easy, medium, and hard question classifications.
- Evaluation criteria for generated questions.
- PostgreSQL persistence using Prisma ORM.
- Gemini token usage and response-time tracking.
- Structured request and AI-response validation.
- API rate limiting and centralized error handling.

## Technology Stack

| Area | Technologies |
|---|---|
| Frontend | Next.js 16, React 19, TypeScript |
| Styling | Tailwind CSS 4 |
| Backend | Node.js, TypeScript, Fastify 5 |
| Database | PostgreSQL |
| ORM | Prisma 6 |
| AI provider | Google Gemini API |
| Validation | Zod |
| Authentication | JWT, Argon2, HTTP-only refresh cookies |
| Testing | Vitest |
| Frontend hosting target | Vercel |
| Backend hosting target | Railway |
| Database hosting target | Neon PostgreSQL |

## Application Architecture

```text
                         USER
                          |
                          v
                Next.js Frontend
                 (Vercel target)
                          |
                          | HTTP requests
                          v
                  Fastify Backend
                 (Railway target)
                          |
              +-----------+-----------+
              |           |           |
              v           v           v
          PostgreSQL    Gemini API   Authentication
           (Neon)       (Google)      Services
              |
              v
       Prisma ORM
```

The frontend communicates with the backend through the versioned `/api/v1` API.

The backend handles validation, AI provider communication, authentication, persistence, and error handling. The Gemini API key remains on the backend.

## Repository Structure

```text
ai-interview-generator/
│
├── backend/
│   ├── prisma/
│   │   ├── migrations/
│   │   └── schema.prisma
│   ├── src/
│   │   ├── config/
│   │   ├── db/
│   │   ├── integrations/
│   │   │   └── gemini/
│   │   ├── repositories/
│   │   ├── routes/
│   │   ├── schemas/
│   │   ├── services/
│   │   ├── app.ts
│   │   └── server.ts
│   ├── tests/
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── generate/
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   ├── globals.css
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx
│   │   ├── components/
│   │   ├── lib/
│   │   └── providers/
│   ├── .env.local
│   └── package.json
│
└── README.md
```

## Prerequisites

Install the following before setting up the project:

- Node.js 24 or a compatible newer release.
- npm.
- PostgreSQL 16 or a compatible PostgreSQL database such as Neon.
- A Google Gemini API key.

## Local Development Setup

### 1. Clone the repository

```bash
git clone https://github.com/tinamanga/ai-interview-generator.git

cd ai-interview-generator
```

### 2. Configure the backend

Navigate into the backend directory:

```bash
cd backend
```

Install dependencies:

```bash
npm install
```

Create your environment file:

```bash
cp .env.example .env
```

Open `backend/.env` and configure the following variables:

| Variable | Description |
|---|---|
| `NODE_ENV` | Application environment: development, test, or production |
| `PORT` | Backend server port; defaults to 5000 |
| `DATABASE_URL` | PostgreSQL connection string |
| `DIRECT_URL` | Direct PostgreSQL connection used by Prisma migrations |
| `ACCESS_TOKEN_SECRET` | Secret used to sign access tokens; minimum 32 characters |
| `GEMINI_API_KEY` | Google Gemini API key |
| `GEMINI_MODEL` | Gemini model identifier |
| `FRONTEND_URL` | Exact frontend origin allowed by CORS and origin validation |

Generate a strong access-token secret locally:

```bash
openssl rand -base64 48
```

Place the generated value in `ACCESS_TOKEN_SECRET` inside your local `.env` file. Do not commit this file or share its contents.

For local development, use a local PostgreSQL database and configure both database connection variables accordingly.

### 3. Generate the Prisma client and run migrations

```bash
npx prisma generate
npx prisma migrate dev
```

These commands should be run from the `backend` directory.

Use `prisma migrate dev` for development databases. For an already-deployed production database, use:

```bash
npx prisma migrate deploy
```

Do not use development migrations against a production database.

### 4. Start the backend

```bash
npm run dev
```

The backend runs on:

```text
http://localhost:5000
```

Keep this terminal running.

### 5. Configure the frontend

Open another terminal and navigate to the frontend directory:

```bash
cd ~/Documents/Projects/ai-interview-generator/frontend
```

Install dependencies:

```bash
npm install
```

Create or update `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
```

The frontend variable must point to the backend API base URL, including `/api/v1`.

### 6. Start the frontend

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

## Application Routes

| Route | Description | Access |
|---|---|---|
| `/` | Public landing page | Public |
| `/register` | Create an account | Public |
| `/login` | Sign in | Public |
| `/generate` | Interview question generation workspace | Frontend authentication required |

Visitors can explore the landing page before registering. They are directed to register or sign in when they want to access the generator.

## Backend API

All endpoints are under `/api/v1`.

| Method | Endpoint | Description |
|---|---|---|
| GET | `/health` | Basic service health check |
| GET | `/ready` | Database readiness check |
| POST | `/auth/register` | Register a new user |
| POST | `/auth/login` | Authenticate a user |
| POST | `/auth/refresh` | Rotate the refresh session and issue a new access token |
| POST | `/auth/logout` | Revoke the current refresh session |
| GET | `/auth/me` | Retrieve the authenticated user's profile |
| POST | `/interviews/generate` | Generate and persist interview questions |

**Authentication implementation note:** the frontend generator page currently requires a signed-in session. The backend interview generation endpoint has not yet been protected by JWT authentication. User ownership association for generated records is also pending. Do not treat the frontend page check as API-level authorization.

## Interview Generation Request

`POST /api/v1/interviews/generate`

Example request:

```json
{
  "jobTitle": "Junior Backend Developer",
  "jobDescription": "We are looking for a developer with Node.js, TypeScript, PostgreSQL and REST API experience.",
  "experienceLevel": "JUNIOR",
  "interviewType": "TECHNICAL",
  "questionCount": 5
}
```

Supported values:

- `experienceLevel`: `JUNIOR`, `MID`, `SENIOR`
- `interviewType`: `TECHNICAL`, `BEHAVIORAL`, `MIXED`
- `questionCount`: integer from 1 to 20

Each generated question includes:

- Question text.
- Category.
- Difficulty.
- Evaluation criteria.

The response also includes generation metadata and Gemini usage information when available.

## Security

The backend currently implements:

- Argon2 password hashing.
- Short-lived JWT access tokens.
- HTTP-only refresh-token cookies.
- SHA-256 hashing of refresh tokens before database storage.
- Refresh-token rotation and reuse detection.
- Origin validation for cookie-dependent authentication endpoints.
- CORS restricted to the configured frontend origin.
- Helmet security headers.
- Global and route-specific rate limiting.
- Request body size limits.
- Redaction of authorization and cookie headers in logs.
- Environment-variable validation.
- Structured input validation using Zod.
- Server-side Gemini API credentials.

The interview generation endpoint still needs backend authentication and user ownership enforcement.

## Testing and Quality Checks

### Backend

From `backend/`:

```bash
npm test
npm run build
```

Optional Gemini integration test:

```bash
npm run test:gemini
```

The Gemini integration test requires a valid API key and access to the configured provider. It may consume provider quota.

### Frontend

From `frontend/`:

```bash
npm run lint
npx tsc --noEmit
npm run build
```

## Deployment Targets

The project is structured for the following hosting arrangement:

| Component | Hosting target | Root directory |
|---|---|---|
| Frontend | Vercel | `frontend` |
| Backend | Railway | `backend` |
| Database | Neon PostgreSQL | Managed PostgreSQL |

Configure production environment variables in the respective hosting platforms. In particular:

- Set the backend `DATABASE_URL` and `DIRECT_URL`.
- Set `ACCESS_TOKEN_SECRET` to a strong secret.
- Set `GEMINI_API_KEY` and `GEMINI_MODEL`.
- Set `FRONTEND_URL` to the exact HTTPS frontend origin.
- Set frontend `NEXT_PUBLIC_API_URL` to the deployed backend API base URL, including `/api/v1`.

Production refresh cookies require HTTPS and use `SameSite=None; Secure`. Ensure the frontend and backend origins are configured correctly.

## Current Development Roadmap

- [x] Backend foundation and Fastify API.
- [x] PostgreSQL database and Prisma schema.
- [x] Gemini integration and structured question generation.
- [x] Generation persistence and usage tracking.
- [x] Frontend landing page and generation workspace.
- [x] User registration and login.
- [x] Refresh-token session management.
- [x] Frontend generator route protection.
- [x] Frontend logout control implementation.
- [ ] Backend JWT protection for interview generation.
- [ ] Associate generated interviews with authenticated users.
- [ ] Add authenticated generation history and ownership checks.
- [ ] Complete end-to-end authentication and generation testing.

## Contributing

1. Create a feature branch.
2. Make focused changes.
3. Run the relevant tests and quality checks.
4. Review your changes before committing.
5. Use clear, descriptive commit messages.

## License

This project currently uses the license configuration in the backend package. A repository-wide license has not yet been specified.
