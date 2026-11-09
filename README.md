#  AI Interview Questions Generator

An AI-powered full-stack application that generates tailored technical and behavioral interview questions based on job descriptions, roles and candidate experience levels.

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-24.x-339933?logo=node.js&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Next.js-16-black?logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/Fastify-5-black?logo=fastify" alt="Fastify" />
  <img src="https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Prisma-6-2D3748?logo=prisma" alt="Prisma" />
  <img src="https://img.shields.io/badge/Gemini-AI-8E75B2?logo=googlegemini" alt="Gemini" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss" alt="Tailwind CSS" />
</p>

---

##  Overview

AI Interview Questions Generator is a full-stack application designed to simplify interview preparation by using Google's Gemini AI to generate relevant interview questions from job information.

Users can provide a job title, job description, experience level and interview type. The application generates structured questions with difficulty levels, competency categories and evaluation criteria.

The project focuses on secure API development, AI integration, structured data validation, database persistence and frontend/backend communication.

##  Features

- AI-powered interview question generation.
- Job title and job description inputs.
- Junior, mid-level and senior experience levels.
- Technical, behavioral and mixed interview types.
- Configurable number of interview questions.
- Structured AI-generated responses.
- Question difficulty classification.
- Skill and competency categorization.
- Evaluation criteria for every question.
- PostgreSQL persistence of generated interviews.
- AI token usage and generation latency tracking.
- Request validation and structured error handling.
- API rate limiting and security headers.
- Responsive frontend interface.
- Loading, validation and error states.

##  Application Preview

The application provides an interface for submitting job information and reviewing AI-generated interview questions.

> Screenshots can be added here as the application evolves.

##  Technology Stack

| Layer | Technology |
|---|---|
| Frontend framework | Next.js 16 |
| UI library | React 19 |
| Frontend language | TypeScript |
| Styling | Tailwind CSS 4 |
| Backend runtime | Node.js |
| Backend language | TypeScript |
| API framework | Fastify 5 |
| Database | PostgreSQL 16 |
| ORM | Prisma 6 |
| AI provider | Google Gemini |
| AI SDK | `@google/genai` |
| Validation | Zod |
| Testing | Vitest |
| Code quality | ESLint |

##  System Architecture

The application follows a client-server architecture with a modular backend.

```text
                 USER
                   |
                   v
             NEXT.JS FRONTEND
              React + TypeScript
                   |
                   | REST API
                   v
              FASTIFY BACKEND
                   |
          +--------+---------+
          |        |         |
          v        v         v
        Routes   Schemas   Middleware
          |
          v
     INTERVIEW SERVICE
          |
      +---+----------------+
      |                    |
      v                    v
  GEMINI API           REPOSITORY
                           |
                           v
                       PRISMA ORM
                           |
                           v
                       POSTGRESQL
```

### Interview Generation Workflow

1. A user submits job information through the frontend.
2. The frontend sends a request to the backend REST API.
3. The backend validates the request using Zod.
4. The interview service constructs a structured AI prompt.
5. Gemini generates interview questions.
6. The backend validates the generated response.
7. Usage information and generation latency are extracted where available.
8. The generation, questions and usage records are persisted in PostgreSQL.
9. The frontend displays the generated questions and associated metadata.

##  Project Structure

```text
ai-interview-generator/
│
├── backend/
│   ├── prisma/
│   ├── src/
│   ├── tests/
│   ├── README.md
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── public/
│   ├── src/
│   ├── README.md
│   ├── package.json
│   └── tsconfig.json
│
├── README.md
└── .gitignore
```

##  Getting Started

### Prerequisites

- Node.js 24 or a compatible modern version.
- npm.
- PostgreSQL 16 or compatible.
- Git.
- Google Gemini API key.

### 1. Clone the repository

```bash
git clone https://github.com/tinamanga/ai-interview-generator.git

cd ai-interview-generator
```

### 2. Set up the backend

Follow the backend setup guide:

[Backend Documentation](backend/README.md)

### 3. Set up the frontend

Follow the frontend setup guide:

[Frontend Documentation](frontend/README.md)

### 4. Run the application

Start the backend and frontend in separate terminal windows.

Backend:

```bash
cd backend
npm install
npm run dev
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

Open the application:

**http://localhost:3000**

The backend API runs at:

**http://localhost:5000**

Both services require their respective environment variables to be configured before running.

## 🌐 API Overview

The backend exposes versioned REST API endpoints.

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/v1/health` | API health check |
| GET | `/api/v1/ready` | Database readiness check |
| POST | `/api/v1/interviews/generate` | Generate interview questions |

For detailed API request formats, response examples and error handling, see the [Backend Documentation](backend/README.md).

##  Security

Security is an important part of this project.

Implemented security foundations include:

- Server-side Gemini API key management.
- Environment variable validation.
- Request validation using Zod.
- Helmet security headers.
- CORS configuration.
- API rate limiting.
- Request body size limits.
- Structured error handling.
- Sensitive header redaction in logs.
- Protection against exposing internal database errors.

Production deployment will require additional environment-specific hardening and monitoring.

##  Testing and Quality

The project uses automated testing and build verification.

Backend:

```bash
cd backend
npm test
npm run build
```

Frontend:

```bash
cd frontend
npm run lint
npm run build
```

A real Gemini integration test is also available:

```bash
cd backend
npm run test:gemini
```

The Gemini integration test requires a valid API key and internet connectivity.

##  Documentation

Detailed documentation is maintained separately for each application layer.

| Documentation | Description |
|---|---|
| [Backend README](backend/README.md) | Backend architecture, setup, database, API, Gemini integration, security and tests |
| [Frontend README](frontend/README.md) | Frontend setup, structure, environment variables and backend integration |

##  Development Roadmap

- [x] Backend project initialization.
- [x] PostgreSQL database and Prisma integration.
- [x] Gemini API integration.
- [x] Structured AI response validation.
- [x] Interview generation REST API.
- [x] Database persistence.
- [x] Token usage and latency tracking.
- [x] API validation and rate limiting.
- [x] Backend automated tests.
- [x] Frontend implementation.
- [x] Frontend and backend integration.
- [x] End-to-end generation verification.
- [ ] Interview generation history.
- [ ] Usage analytics and reporting.
- [ ] Production deployment.
- [ ] Additional production security hardening.

##  Contributing

Contributions, suggestions and improvements are welcome.

1. Fork the repository.
2. Create a feature branch.
3. Make your changes.
4. Run relevant tests and builds.
5. Submit a pull request.

##  Author

**Christina Manga**

Software Engineer | Full-Stack Development | Backend Engineering | API Security

- GitHub: [@tinamanga](https://github.com/tinamanga)
- LinkedIn: [Christina Manga](https://www.linkedin.com/in/christina-manga-aa314a370)

---

<p align="center">
  <strong>Built with curiosity, continuous learning and a focus on secure, reliable AI-powered applications.</strong>
</p>