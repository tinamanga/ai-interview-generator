// frontend/src/lib/auth-api.ts

// Public account information returned by the backend.
// Password hashes and other private account data are never exposed.
export interface AuthUser {
  id: string;
  email: string;
  createdAt: string;
}

export interface AuthSession {
  user: AuthUser;
  accessToken: string;
}

interface AuthSuccessResponse {
  success: true;
  message?: string;
  data: AuthSession | { user: AuthUser };
}

interface AuthErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Array<{
      field: string;
      message: string;
    }>;
  };
}

export class AuthApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code: string,
    public readonly details?: AuthErrorResponse["error"]["details"],
  ) {
    super(message);
    this.name = "AuthApiError";
  }
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

function getApiUrl(path: string): string {
  if (!API_BASE_URL) {
    throw new Error("The API URL has not been configured.");
  }

  return `${API_BASE_URL.replace(/\/+$/, "")}/${path}`;
}

// Convert backend error responses into a predictable frontend error.
async function readResponse<T>(
  response: Response,
): Promise<T> {
  let result: AuthSuccessResponse | AuthErrorResponse;

  try {
    result = (await response.json()) as
      | AuthSuccessResponse
      | AuthErrorResponse;
  } catch {
    throw new AuthApiError(
      "The server returned an invalid response.",
      response.status,
      "INVALID_RESPONSE",
    );
  }

  if (!response.ok || !result.success) {
    const error = result as AuthErrorResponse;

    throw new AuthApiError(
      error.error?.message ?? "The authentication request failed.",
      response.status,
      error.error?.code ?? "UNKNOWN_ERROR",
      error.error?.details,
    );
  }

  return result as T;
}

// Registration and login establish a refresh cookie in the browser.
async function authenticate(
  endpoint: "register" | "login",
  email: string,
  password: string,
): Promise<AuthSession> {
  const response = await fetch(getApiUrl(`auth/${endpoint}`), {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  const result = await readResponse<{
    success: true;
    data: AuthSession;
  }>(response);

  return result.data;
}

export function register(
  email: string,
  password: string,
): Promise<AuthSession> {
  return authenticate("register", email, password);
}

export function login(
  email: string,
  password: string,
): Promise<AuthSession> {
  return authenticate("login", email, password);
}

// Refresh requests rotate the HttpOnly refresh cookie.
// Keep one shared request so React Strict Mode cannot accidentally
// submit the same rotating refresh token twice during initialization.
let refreshPromise: Promise<AuthSession> | null = null;

export function refreshAuthSession(): Promise<AuthSession> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const response = await fetch(getApiUrl("auth/refresh"), {
        method: "POST",
        credentials: "include",
      });

      const result = await readResponse<{
        success: true;
        data: AuthSession;
      }>(response);

      return result.data;
    })().finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
}

// Logout revokes the refresh session and clears its browser cookie.
export async function logoutRequest(): Promise<void> {
  const response = await fetch(getApiUrl("auth/logout"), {
    method: "POST",
    credentials: "include",
  });

  await readResponse<{
    success: true;
    message: string;
  }>(response);
}
