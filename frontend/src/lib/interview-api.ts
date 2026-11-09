// frontend/src/lib/interview-api.ts

// The values must match the enums accepted by the backend.
export type ExperienceLevel = "JUNIOR" | "MID" | "SENIOR";

export type InterviewType = "TECHNICAL" | "BEHAVIORAL" | "MIXED";

export type QuestionDifficulty = "EASY" | "MEDIUM" | "HARD";

// Data sent from the frontend to Fastify.
export interface GenerateInterviewRequest {
  jobTitle: string;
  jobDescription: string;
  experienceLevel: ExperienceLevel;
  interviewType: InterviewType;
  questionCount: number;
}

// A generated question returned by the backend.
export interface GeneratedQuestion {
  id: string;
  generationId: string;
  position: number;
  question: string;
  category: string;
  difficulty: QuestionDifficulty;
  evaluationCriteria: string;
  createdAt: string;
}

// Token usage and performance information returned by Gemini.
export interface UsageRecord {
  id: string;
  generationId: string;
  inputTokens: number | null;
  outputTokens: number | null;
  totalTokens: number | null;
  latencyMs: number;
  providerRequestId: string | null;
  createdAt: string;
}

// A successfully saved generation.
export interface InterviewGeneration {
  id: string;
  jobTitle: string;
  jobDescription: string;
  experienceLevel: ExperienceLevel;
  interviewType: InterviewType;
  questionCount: number;
  provider: string;
  model: string;
  promptVersion: string;
  status: "PENDING" | "SUCCEEDED" | "FAILED";
  errorCode: string | null;
  createdAt: string;
  completedAt: string | null;
  questions: GeneratedQuestion[];
  usage: UsageRecord | null;
}

// Standard successful API response.
interface GenerateInterviewResponse {
  success: true;
  message: string;
  data: InterviewGeneration;
}

// Standard API error response.
interface ApiErrorResponse {
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

// Custom error class allows the UI to distinguish API errors.
export class InterviewApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code: string,
    public readonly details?: ApiErrorResponse["error"]["details"],
  ) {
    super(message);
    this.name = "InterviewApiError";
  }
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

// Sends a generation request to the Fastify backend.
export async function generateInterview(
  input: GenerateInterviewRequest,
): Promise<InterviewGeneration> {
  if (!API_BASE_URL) {
    throw new Error("The API URL has not been configured.");
  }

  const response = await fetch(
    `${API_BASE_URL}/interviews/generate`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    },
  );

  // Read the response as JSON.
  const result = (await response.json()) as
    | GenerateInterviewResponse
    | ApiErrorResponse;

  // Convert unsuccessful API responses into a consistent error.
  if (!response.ok || !result.success) {
    const errorResult = result as ApiErrorResponse;

    throw new InterviewApiError(
      errorResult.error?.message ??
        "Unable to generate interview questions.",
      response.status,
      errorResult.error?.code ?? "UNKNOWN_ERROR",
      errorResult.error?.details,
    );
  }

  return result.data;
}