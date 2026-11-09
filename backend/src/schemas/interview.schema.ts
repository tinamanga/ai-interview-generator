
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
