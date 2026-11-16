# InterviewIQ Frontend

The InterviewIQ frontend is a web application built with Next.js, React, TypeScript, and Tailwind CSS.

It provides the public landing page, user authentication screens, and the interview question generation workspace.

## Technology Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- ESLint

## Project Structure

```text
frontend/
├── src/
│   ├── app/
│   │   ├── generate/
│   │   │   └── page.tsx
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── register/
│   │   │   └── page.tsx
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   └── auth-form.tsx
│   ├── lib/
│   │   ├── auth-api.ts
│   │   ├── auth-redirect.ts
│   │   ├── difficulty.ts
│   │   └── interview-api.ts
│   └── providers/
│       └── auth-provider.tsx
├── public/
├── .env.local
├── package.json
└── tsconfig.json
```

## Application Routes

| Route | Description | Access |
|---|---|---|
| `/` | Public landing page and product introduction | Public |
| `/register` | Account registration | Public |
| `/login` | User login | Public |
| `/generate` | Interview question generation workspace | Frontend authentication required |

## User Journey

1. A visitor opens the public landing page.
2. The visitor can explore the features and sample questions without registering.
3. When the visitor chooses to generate questions, they are directed to register or log in.
4. After successful authentication, the visitor is redirected to the generator.
5. The signed-in user enters the job details and generation preferences.
6. The frontend submits the request to the backend.
7. The generated questions and their metadata are displayed in the workspace.
8. The user can log out from the generator navigation.

## Features

### Public landing page

The landing page introduces InterviewIQ and explains:

- What the application does.
- How AI-generated interview preparation works.
- The available question categories and difficulty levels.
- The expected generation workflow.
- Sample interview questions.

The landing page does not require an account.

### Authentication

The application includes:

- Registration form.
- Login form.
- Client-side form validation and backend error display.
- Password visibility control.
- Session restoration when the application starts.
- Logout action.
- Safe post-authentication redirects.

The authentication form uses the shared component:

```text
src/components/auth-form.tsx
```

### Interview generation workspace

The generator allows users to provide:

- Job title.
- Job description.
- Candidate experience level.
- Interview type.
- Number of questions.

Available experience levels:

- Junior
- Mid-level
- Senior

Available interview types:

- Technical
- Behavioral
- Mixed

The question count can be selected from 3, 5, 10, 15, or 20.

Generated results display:

- Question number.
- Question text.
- Category.
- Difficulty.
- Evaluation criteria.
- AI provider and model information.
- Response latency.
- Input, output, and total token usage when available.

Difficulty badges use a shared helper to keep the same visual styling throughout the application:

```text
src/lib/difficulty.ts
```

## Authentication Architecture

Authentication state is managed through:

```text
src/providers/auth-provider.tsx
```

The provider exposes:

- `user`
- `accessToken`
- `status`
- `login()`
- `register()`
- `logout()`

Authentication status can be:

- `loading`
- `authenticated`
- `unauthenticated`

### Session restoration

When the application starts, the auth provider calls the backend refresh endpoint.

If the refresh cookie is valid, the backend rotates the refresh session and returns a new access token and user profile.

The provider stores the access token in React application state. It does not store the access token in local storage.

### Refresh-token cookie

The refresh token is managed by the backend through an HTTP-only cookie. Frontend authentication requests use:

```ts
credentials: "include"
```

This allows the browser to send the cookie to the backend.

### Logout

The generator navigation includes a logout button.

The frontend sends a request to the backend logout endpoint. The backend revokes the current refresh session and clears the cookie. The frontend then clears its local authentication state and redirects to the login page.

### Protected generator page

The generator page checks the authentication provider's status before rendering the workspace.

Unauthenticated visitors are redirected to:

```text
/login?next=%2Fgenerate
```

The application uses a safe redirect helper to avoid accepting unsafe external redirect destinations.

**Important:** this is frontend route protection. The backend interview generation endpoint has not yet been updated to require a JWT. API-level authentication and user ownership enforcement remain pending.

## Backend API Configuration

The frontend communicates with the Fastify backend through:

```text
src/lib/auth-api.ts
src/lib/interview-api.ts
```

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
```

The variable must contain the backend base URL, including `/api/v1`.

For production, replace the local URL with the deployed backend API base URL.

The `NEXT_PUBLIC_` prefix means this value is available in browser-side code. Never put private credentials, database passwords, JWT secrets, or Gemini API keys in frontend environment variables.

## Local Development

### 1. Install dependencies

From the frontend directory:

```bash
npm install
```

### 2. Configure the API URL

Create or update `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
```

Ensure the backend is running and its `FRONTEND_URL` is configured to match the frontend origin.

### 3. Start the development server

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

## NPM Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the Next.js development server |
| `npm run build` | Create an optimized production build |
| `npm start` | Start the production server |
| `npm run lint` | Run ESLint |

Run TypeScript checks with:

```bash
npx tsc --noEmit
```

## Quality Checks

Before committing frontend changes, run:

```bash
npm run lint
npx tsc --noEmit
npm run build
```

All three checks should complete successfully.

## Production Deployment

The frontend deployment target is Vercel.

Set the project root directory to:

```text
frontend
```

Configure this environment variable in Vercel:

```env
NEXT_PUBLIC_API_URL=https://YOUR-BACKEND-DOMAIN/api/v1
```

Replace the example with the actual deployed backend API URL.

The backend must also have its `FRONTEND_URL` configured to the exact deployed frontend origin.

For production authentication cookies, the backend uses:

- `HttpOnly`
- `Secure`
- `SameSite=None`

The frontend and backend must use HTTPS for the production cross-origin cookie flow.

After changing frontend environment variables in Vercel, redeploy the application so the new configuration is included in the build.

## Development Roadmap

- [x] Public landing page.
- [x] Interview generation workspace.
- [x] Backend API integration.
- [x] Shared question difficulty styling.
- [x] Registration and login screens.
- [x] Authentication provider and session restoration.
- [x] Protected generator page.
- [x] Logout control.
- [ ] Send access tokens with generation requests after backend JWT protection is implemented.
- [ ] Handle access-token expiry and refresh for authenticated API requests.
- [ ] Add authenticated generation history.
- [ ] Add end-to-end frontend authentication and generation tests.
