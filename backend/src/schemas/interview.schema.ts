
import { z } from "zod";

// Validate the information submitted when requesting interview questions.
export const generateInterviewSchema = z.object({
  jobTitle: z
    .string()
    .trim()
    .min(2, "Job title must contain at least 2 characters.")
    .max(150, "Job title cannot exceed 150 characters."),

  jobDescription: z
    .string()
    .trim()
    .min(20, "Job description must contain at least 20 characters.")
    .max(10_000, "Job description cannot exceed 10,000 characters."),

  experienceLevel: z.enum(["JUNIOR", "MID", "SENIOR"]),

  interviewType: z.enum(["TECHNICAL", "BEHAVIORAL", "MIXED"]),

  questionCount: z
    .number()
    .int("Question count must be a whole number.")
    .min(1, "Generate at least 1 question.")
    .max(20, "You can generate a maximum of 20 questions.")
}).strict();

// Infer the TypeScript type directly from the validation schema.
// This keeps validation rules and application types synchronized.
export type GenerateInterviewRequest = z.infer<
  typeof generateInterviewSchema
>;

// Validate pagination parameters for interview history.
export const interviewHistoryQuerySchema = z.object({
  page: z.coerce
    .number()
    .int()
    .min(1)
    .default(1),

  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(50)
    .default(10),

  search: z.string()
    .trim()
    .max(150, "Search cannot exceed 150 characters.")
    .optional(),

  interviewType: z.enum(["TECHNICAL", "BEHAVIORAL", "MIXED"])
    .optional(),

  experienceLevel: z.enum(["JUNIOR", "MID", "SENIOR"])
    .optional()
}).strict();

// Reuse the validated filter type in the repository and route.
export type InterviewHistoryQuery = z.infer<
  typeof interviewHistoryQuerySchema
>;

// Validate the ID used to retrieve a saved interview.
export const interviewIdParamsSchema = z.object({
  id: z.string().uuid("A valid interview ID is required.")
}).strict();


// Validate pagination parameters when retrieving bookmarked interviews.
export const interviewBookmarksQuerySchema = z.object({
  page: z.coerce
    .number()
    .int()
    .min(1)
    .default(1),

  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(50)
    .default(10)
}).strict();

// Keep bookmark pagination types synchronized with validation rules.
export type InterviewBookmarksQuery = z.infer<
  typeof interviewBookmarksQuerySchema
>;
