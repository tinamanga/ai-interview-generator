
// frontend/src/lib/interview-api.ts

// These values must match the enums accepted by the backend.
export type ExperienceLevel = "JUNIOR" | "MID" | "SENIOR";

export type InterviewType = "TECHNICAL" | "BEHAVIORAL" | "MIXED";

export type QuestionDifficulty = "EASY" | "MEDIUM" | "HARD";

// Data sent from the frontend to the Fastify backend.
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

// Token usage and performance information returned by the AI provider.
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

// A successfully saved interview generation.
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

// A compact interview record returned by the history endpoint.
export interface InterviewHistoryItem {
  id: string;
  jobTitle: string;
  experienceLevel: ExperienceLevel;
  interviewType: InterviewType;
  questionCount: number;
  createdAt: string;
  completedAt: string | null;
  _count: {
    questions: number;
  };
}

// Pagination metadata returned alongside interview history.
export interface InterviewHistoryPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// Complete interview history response.
export interface InterviewHistoryResult {
  interviews: InterviewHistoryItem[];
  pagination: InterviewHistoryPagination;
}

// A saved interview with its questions, returned by the detail endpoint.
export interface SavedInterview {
  id: string;
  jobTitle: string;
  jobDescription: string;
  experienceLevel: ExperienceLevel;
  interviewType: InterviewType;
  questionCount: number;
  createdAt: string;
  completedAt: string | null;
  questions: Array<{
    id: string;
    position: number;
    question: string;
    category: string;
    difficulty: QuestionDifficulty;
    evaluationCriteria: string;
    createdAt: string;
  }>;
}

// Standard successful API response.
interface ApiSuccessResponse<T> {
  success: true;
  message?: string;
  data: T;
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

// Custom error class lets the UI distinguish API errors.
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

// Backend API base URL, configured through the frontend environment.
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "");

// Ensures the API URL is configured before making requests.
function getApiBaseUrl(): string {
  if (!API_BASE_URL) {
    throw new Error("The API URL has not been configured.");
  }

  return API_BASE_URL;
}

// Shared response parser for all interview API requests.
// It also handles unexpected non-JSON responses safely.
async function parseInterviewResponse<T>(
  response: Response,
  fallbackMessage: string,
): Promise<T> {
  let result: ApiSuccessResponse<T> | ApiErrorResponse;

  try {
    result = (await response.json()) as
      | ApiSuccessResponse<T>
      | ApiErrorResponse;
  } catch {
    throw new InterviewApiError(
      fallbackMessage,
      response.status,
      "INVALID_API_RESPONSE",
    );
  }

  if (!response.ok || !result.success) {
    const errorResult = result as ApiErrorResponse;

    throw new InterviewApiError(
      errorResult.error?.message ?? fallbackMessage,
      response.status,
      errorResult.error?.code ?? "UNKNOWN_ERROR",
      errorResult.error?.details,
    );
  }

  return result.data;
}

// Generates tailored interview questions for an authenticated user.
export async function generateInterview(
  input: GenerateInterviewRequest,
  accessToken: string,
): Promise<InterviewGeneration> {
  const response = await fetch(
    `${getApiBaseUrl()}/interviews/generate`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(input),
    },
  );

  return parseInterviewResponse<InterviewGeneration>(
    response,
    "Unable to generate interview questions.",
  );
}

// Optional filters supported by the interview history endpoint.
export interface InterviewHistoryFilters {
  search?: string;
  interviewType?: InterviewType;
  experienceLevel?: ExperienceLevel;
}

// Retrieves one page of interview history for the authenticated user.
export async function getInterviewHistory(
  page: number,
  limit: number,
  accessToken: string,
  filters: InterviewHistoryFilters = {},
): Promise<InterviewHistoryResult> {
  const query = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });

  if (filters.search?.trim()) {
    query.set("search", filters.search.trim());
  }

  if (filters.interviewType) {
    query.set("interviewType", filters.interviewType);
  }

  if (filters.experienceLevel) {
    query.set("experienceLevel", filters.experienceLevel);
  }

  const response = await fetch(
    `${getApiBaseUrl()}/interviews?${query.toString()}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    },
  );

  return parseInterviewResponse<InterviewHistoryResult>(
    response,
    "Unable to retrieve interview history.",
  );
}

// Retrieves one saved interview and its generated questions.
// The backend checks that the interview belongs to the authenticated user.
export async function getInterviewById(
  interviewId: string,
  accessToken: string,
): Promise<SavedInterview> {
  const response = await fetch(
    `${getApiBaseUrl()}/interviews/${encodeURIComponent(interviewId)}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    },
  );

  return parseInterviewResponse<SavedInterview>(
    response,
    "Unable to retrieve the saved interview.",
  );
}
