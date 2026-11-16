# InterviewIQ Backend

The InterviewIQ backend is a REST API built with Node.js, TypeScript, and Fastify. It handles authentication, interview question generation, Gemini integration, request validation, and PostgreSQL persistence.

## Technology Stack

- Node.js 24+
- TypeScript
- Fastify 5
- PostgreSQL
- Prisma ORM 6
- Google Gemini API
- Zod
- Argon2
- JWT
- Vitest

## Project Structure

```text
backend/
├── prisma/
│   ├── migrations/
│   └── schema.prisma
├── src/
│   ├── config/
│   │   └── env.ts
│   ├── db/
│   │   └── prisma.ts
│   ├── integrations/
│   │   └── gemini/
│   │       ├── gemini.client.ts
│   │       ├── gemini.errors.ts
│   │       └── gemini.schema.ts
│   ├── repositories/
│   │   └── interview.repository.ts
│   ├── routes/
│   │   ├── auth.routes.ts
│   │   ├── health.routes.ts
│   │   └── interview.routes.ts
│   ├── schemas/
│   │   ├── auth.schema.ts
│   │   └── interview.schema.ts
│   ├── services/
│   │   ├── auth.service.ts
│   │   ├── interview.service.ts
│   │   └── session.service.ts
│   ├── app.ts
│   └── server.ts
├── tests/
├── .env.example
├── package.json
└── tsconfig.json
```

## Responsibilities by Layer

| Layer | Responsibility |
|---|---|
| Routes | HTTP endpoints, request handling, response formatting |
| Schemas | Validate incoming requests and structured data |
| Services | Authentication, session management, and interview generation logic |
| Integrations | Communicate with external providers such as Gemini |
| Repositories | Persist and retrieve application data |
| Database | Prisma client and PostgreSQL connection |
| Config | Environment validation and application configuration |

## Environment Configuration

Create a local environment file:

```bash
cp .env.example .env
```

Configure these variables:

| Variable | Required | Description |
|---|---|---|
| `NODE_ENV` | No | `development`, `test`, or `production` |
| `PORT` | No | HTTP port; defaults to `5000` |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `DIRECT_URL` | Yes | Direct connection used by Prisma migrations |
| `ACCESS_TOKEN_SECRET` | Yes | JWT signing secret; minimum 32 characters |
| `GEMINI_API_KEY` | Production | Google Gemini API key |
| `GEMINI_MODEL` | Production | Gemini model identifier |
| `FRONTEND_URL` | No | Allowed frontend origin; defaults to local port 3000 |

Generate a strong access-token secret:

```bash
openssl rand -base64 48
```

Add the generated value to your local `.env` as `ACCESS_TOKEN_SECRET`.

Never commit `.env` or expose database credentials, JWT secrets, or provider API keys.

The backend validates environment configuration when it starts. Production startup also requires Gemini configuration and an HTTPS frontend URL.

## Local Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure PostgreSQL

Create a PostgreSQL database for local development, or configure a suitable PostgreSQL connection.

Set `DATABASE_URL` and `DIRECT_URL` in `.env`.

For local development, these may point to the same database. For hosted databases, use the appropriate connection strings and follow the database provider's connection guidance.

### 3. Generate Prisma Client

```bash
npx prisma generate
```

### 4. Apply development migrations

```bash
npx prisma migrate dev
```

Use this command for development databases.

For production databases, apply existing migrations with:

```bash
npx prisma migrate deploy
```

Do not use `prisma migrate dev` against the production database.

### 5. Start the development server

```bash
npm run dev
```

The backend is available at:

```text
http://localhost:5000
```

## NPM Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the development server with file watching |
| `npm run build` | Compile TypeScript into `dist/` |
| `npm start` | Start the compiled production server |
| `npm test` | Run the Vitest test suite |
| `npm run test:watch` | Run Vitest in watch mode |
| `npm run test:gemini` | Run the Gemini integration test |
| `npm run prisma:generate` | Generate Prisma Client |
| `npm run prisma:migrate` | Run Prisma development migrations |

## API

All routes are registered under:

```text
/api/v1
```

### Health

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/v1/health` | Confirms that the service is responding |
| GET | `/api/v1/ready` | Checks database connectivity |

The readiness endpoint executes a database query. It returns a service-unavailable response if the database cannot be reached.

### Authentication

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/v1/auth/register` | Create an account |
| POST | `/api/v1/auth/login` | Authenticate an existing account |
| POST | `/api/v1/auth/refresh` | Rotate a refresh session |
| POST | `/api/v1/auth/logout` | Revoke the current refresh session |
| GET | `/api/v1/auth/me` | Retrieve the current user's profile |

#### Registration

Request:

```json
{
  "email": "candidate@example.com",
  "password": "a-strong-password"
}
```

Successful registration returns HTTP `201`, a public user profile, and an access token. The refresh token is set as an HTTP-only cookie.

Registration password requirements:

- Minimum 12 characters.
- Maximum 128 characters.

Email addresses are trimmed and normalized to lowercase.

Possible errors include:

- `400 VALIDATION_ERROR`
- `403 INVALID_ORIGIN`
- `409 EMAIL_ALREADY_REGISTERED`
- `500 INTERNAL_SERVER_ERROR`

#### Login

Uses the same email and password request structure.

Successful login returns HTTP `200`, a public user profile, and an access token. The refresh token is set as an HTTP-only cookie.

Invalid credentials return HTTP `401` with `INVALID_CREDENTIALS`.

#### Refresh session

`POST /api/v1/auth/refresh`

This endpoint reads the refresh token from the HTTP-only cookie. It rotates the refresh token and returns a new access token and public user profile.

It requires an allowed `Origin` header.

An invalid or expired session returns HTTP `401`.

#### Logout

`POST /api/v1/auth/logout`

This endpoint revokes the current refresh session when a refresh cookie is present and clears the cookie.

It requires an allowed `Origin` header.

#### Current user

`GET /api/v1/auth/me`

Requires a valid access token:

```http
Authorization: Bearer YOUR_ACCESS_TOKEN
```

Returns the authenticated user's public profile. Password hashes are never returned.

### Interview generation

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/v1/interviews/generate` | Generate and persist interview questions |

Example request:

```json
{
  "jobTitle": "Junior Backend Developer",
  "jobDescription": "We need a developer familiar with Node.js, TypeScript, PostgreSQL, and REST APIs.",
  "experienceLevel": "JUNIOR",
  "interviewType": "TECHNICAL",
  "questionCount": 5
}
```

Validation rules:

| Field | Rules |
|---|---|
| `jobTitle` | String, 2–150 characters |
| `jobDescription` | String, 20–10,000 characters |
| `experienceLevel` | `JUNIOR`, `MID`, or `SENIOR` |
| `interviewType` | `TECHNICAL`, `BEHAVIORAL`, or `MIXED` |
| `questionCount` | Integer from 1 to 20 |

The request schema is strict and rejects unknown fields.

Each generated question includes:

- `question`
- `category`
- `difficulty`
- `evaluationCriteria`

The response also includes generation information and usage metadata where available.

**Current authentication limitation:** this endpoint has a route-specific rate limit, but it does not yet require a JWT. The frontend generator page is protected separately. Backend JWT enforcement and association of generations with authenticated users remain planned work.

## Gemini Integration

Gemini communication is isolated in:

```text
src/integrations/gemini/
```

The integration uses the official Google GenAI SDK.

### Structured output

The application requests JSON output using a Gemini response schema.

The expected structure is:

```json
{
  "questions": [
    {
      "question": "Explain how a REST API handles an incoming request.",
      "category": "API Fundamentals",
      "difficulty": "EASY",
      "evaluationCriteria": "Demonstrates understanding of HTTP methods, routing, and request handling."
    }
  ]
}
```

The response is validated again with Zod before it is used by the application.

### Generation settings

The generation service:

- Uses the configured `GEMINI_MODEL`.
- Requests structured JSON output.
- Sets a maximum output token budget of 6,000.
- Uses a 20-second provider request timeout.
- Retries eligible temporary provider failures once, with backoff.
- Does not retry authentication failures, invalid models, or provider rate limits.
- Records response latency and available token usage metadata.

The job description is treated as untrusted input in the generation instructions.

### Provider error handling

Known Gemini errors are mapped to HTTP responses.

| Error category | HTTP status |
|---|---:|
| Provider not configured or unavailable | 503 |
| Provider timeout | 504 |
| Provider rate limit | 429 |
| Provider authentication or invalid response | 502 |
| Unexpected application error | 500 |

Provider diagnostics are logged server-side. Internal error details are not returned to the client.

## Database

Prisma manages the PostgreSQL schema.

The main models include:

| Model | Purpose |
|---|---|
| `User` | Stores registered user accounts |
| `RefreshSession` | Stores hashed refresh tokens and session metadata |
| `Generation` | Stores interview generation inputs and metadata |
| `GeneratedQuestion` | Stores individual generated questions |
| `UsageRecord` | Stores provider token usage and latency |

The schema also defines:

- `ExperienceLevel`: `JUNIOR`, `MID`, `SENIOR`
- `InterviewType`: `TECHNICAL`, `BEHAVIORAL`, `MIXED`
- `GenerationStatus`: `PENDING`, `SUCCEEDED`, `FAILED`
- `QuestionDifficulty`: `EASY`, `MEDIUM`, `HARD`

Generation creation uses Prisma nested writes so the generation, its questions, and usage record are persisted atomically.

The `Generation.userId` relationship is currently optional. The generation route does not yet populate it.

## Authentication and Session Security

### Passwords

Passwords are hashed with Argon2 before being stored. Plain-text passwords are never persisted.

### Access tokens

Access tokens are signed using `ACCESS_TOKEN_SECRET` and have a 15-minute lifetime.

### Refresh tokens

Refresh tokens:

- Are generated using cryptographically secure random bytes.
- Are stored in the database as SHA-256 hashes.
- Are sent to the browser using an HTTP-only cookie.
- Have a 30-day expiry.
- Rotate when refreshed.
- Use token families to detect reuse of revoked tokens.

Cookie configuration:

| Setting | Development | Production |
|---|---|---|
| HttpOnly | Enabled | Enabled |
| Secure | Disabled | Enabled |
| SameSite | `lax` | `none` |
| Path | `/api/v1/auth` | `/api/v1/auth` |

Refresh and logout endpoints require an allowed origin.

## API Security Controls

The application currently configures:

- Helmet security headers.
- CORS restricted to `FRONTEND_URL`.
- Credentialed browser requests for refresh cookies.
- Global rate limiting of 100 requests per minute.
- Registration and login limits of 5 requests per minute.
- Refresh limit of 10 requests per minute.
- Logout limit of 20 requests per minute.
- Interview generation limit of 5 requests per minute.
- Request body limit of 1 MiB.
- Redaction of authorization and cookie headers in logs.
- Zod validation for authentication and generation input.

These rate limits are configured per application route and are not a replacement for provider-side quota controls.

## Testing

Run the backend test suite:

```bash
npm test
```

Compile the application:

```bash
npm run build
```

Run the optional Gemini integration test:

```bash
npm run test:gemini
```

The Gemini integration test requires a configured API key and provider access. It may consume API quota.

## Production Deployment

The backend deployment target is Railway, with the service root directory set to:

```text
backend
```

Configure the following production variables in the hosting platform:

- `NODE_ENV=production`
- `PORT` if required by the hosting platform
- `DATABASE_URL`
- `DIRECT_URL`
- `ACCESS_TOKEN_SECRET`
- `GEMINI_API_KEY`
- `GEMINI_MODEL`
- `FRONTEND_URL`

`FRONTEND_URL` must be the exact HTTPS frontend origin.

Before starting a production release:

1. Configure the production database.
2. Apply migrations using `npx prisma migrate deploy`.
3. Confirm all required environment variables are set.
4. Confirm the readiness endpoint can reach PostgreSQL.
5. Confirm the frontend origin and cookie configuration are correct.

## Development Roadmap

- [x] Fastify server foundation.
- [x] Environment validation.
- [x] Prisma and PostgreSQL integration.
- [x] Gemini structured generation.
- [x] Generation persistence and usage tracking.
- [x] Authentication registration and login.
- [x] Refresh-token rotation and revocation.
- [x] Authenticated user profile endpoint.
- [ ] Require JWT authentication on interview generation.
- [ ] Associate generated interviews with authenticated users.
- [ ] Add generation history and user ownership checks.
- [ ] Add end-to-end API tests for authenticated generation.
