# Frontend – AI Interview Questions Generator

The frontend is the user-facing interface for the AI Interview Questions Generator.

It allows users to enter job information, select interview preferences and generate tailored interview questions through the backend REST API.

## Table of Contents

- [Overview](#overview)
- [Technology Stack](#technology-stack)
- [Features](#features)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Running the Application](#running-the-application)
- [Backend Integration](#backend-integration)
- [Application Workflow](#application-workflow)
- [Build and Linting](#build-and-linting)

## Overview

The frontend is built with Next.js, React, TypeScript and Tailwind CSS.

It communicates with the backend API to generate and display interview questions based on:

- Job title.
- Job description.
- Candidate experience level.
- Interview type.
- Requested question count.

The interface also displays question categories, difficulty levels, evaluation criteria and available AI usage metadata.

## Technology Stack

| Technology | Purpose |
|---|---|
| Next.js 16 | React application framework |
| React 19 | UI development |
| TypeScript | Type-safe development |
| Tailwind CSS 4 | Styling |
| ESLint | Code quality and linting |

## Features

- Job title input.
- Job description input.
- Experience level selection.
- Technical, behavioral and mixed interview types.
- Configurable question count.
- Backend API integration.
- Loading state during generation.
- Form validation and error handling.
- Generated question display.
- Question difficulty and evaluation criteria.
- AI model and usage metadata display where available.

## Project Structure

```text
frontend/
├── public/
│
├── src/
│   ├── app/
│   │   ├── favicon.ico
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   │
│   └── lib/
│       └── interview-api.ts
│
├── .env.local
├── .gitignore
├── eslint.config.mjs
├── next.config.ts
├── package.json
├── package-lock.json
└── tsconfig.json
```

### Important files

| File | Responsibility |
|---|---|
| `src/app/page.tsx` | Main application interface and generation form |
| `src/app/layout.tsx` | Root layout and page metadata |
| `src/app/globals.css` | Global styling |
| `src/lib/interview-api.ts` | Backend API client |
| `next.config.ts` | Next.js configuration |
| `tsconfig.json` | TypeScript configuration |

## Prerequisites

Install:

- Node.js 24 or a compatible modern version.
- npm.
- Git.
- A running instance of the backend API.

## Getting Started

### 1. Navigate to the frontend

```bash
cd frontend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a local environment file:

```bash
touch .env.local
```

Add the backend API URL:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
```

The frontend uses this URL to communicate with the backend.

Do not put the Gemini API key or database credentials in this file.

### 4. Start the development server

```bash
npm run dev
```

Open:

`http://localhost:3000`

Make sure the backend is also running.

## Environment Variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | Base URL of the backend API |

Example local development configuration:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
```

The `NEXT_PUBLIC_` prefix means the value can be included in browser-side code. Therefore, only public configuration such as the backend URL should use this prefix.

Never expose private API credentials through frontend environment variables.

## Running the Application

Start the development server:

```bash
npm run dev
```

Create a production build:

```bash
npm run build
```

Start the production server:

```bash
npm start
```

## Backend Integration

The frontend communicates with the backend through the API client located at:

`src/lib/interview-api.ts`

The API client sends requests to:

`POST /interviews/generate`

The complete local development endpoint is:

`http://localhost:5000/api/v1/interviews/generate`

Example request:

```json
{
  "jobTitle": "Junior Backend Developer",
  "jobDescription": "Looking for a developer with Node.js and PostgreSQL experience.",
  "experienceLevel": "JUNIOR",
  "interviewType": "TECHNICAL",
  "questionCount": 5
}
```

The frontend handles:

- Successful API responses.
- API validation errors.
- Rate-limit responses.
- Provider errors.
- Network failures.

Generated questions are rendered from the backend response rather than generated directly in the browser.

## Application Workflow

1. The user enters a job title and job description.
2. The user selects an experience level.
3. The user selects an interview type.
4. The user chooses the number of questions.
5. The frontend validates the form.
6. The API client sends the request to the backend.
7. The backend generates and saves the questions.
8. The frontend displays the returned questions and available usage information.

## Build and Linting

### Run ESLint

```bash
npm run lint
```

### Create a production build

```bash
npm run build
```

The production build runs compilation, TypeScript checks and static page generation.

---

**Frontend development:** Christina Manga
**Project:** AI Interview Questions Generator
**Repository:** [GitHub](https://github.com/tinamanga/ai-interview-generator)