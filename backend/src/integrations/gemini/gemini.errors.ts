
export type GeminiErrorCode =
  | "GEMINI_NOT_CONFIGURED"
  | "GEMINI_TIMEOUT"
  | "GEMINI_RATE_LIMITED"
  | "GEMINI_AUTH_FAILED"
  | "GEMINI_MODEL_NOT_FOUND"
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
