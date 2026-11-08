// Stable error codes used internally by the application.
// These codes allow API routes to handle provider failures consistently.

export type GeminiErrorCode =
  | "GEMINI_NOT_CONFIGURED"
  | "GEMINI_TIMEOUT"
  | "GEMINI_RATE_LIMITED"
  | "GEMINI_AUTH_FAILED"
  | "GEMINI_UNAVAILABLE"
  | "GEMINI_INVALID_RESPONSE"
  | "GEMINI_PROVIDER_ERROR";

export class GeminiIntegrationError extends Error {
  public readonly code: GeminiErrorCode;

  constructor(code: GeminiErrorCode, message: string) {
    super(message);
    this.name = "GeminiIntegrationError";
    this.code = code;
  }
}
