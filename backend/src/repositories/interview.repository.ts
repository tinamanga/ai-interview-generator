import {
  ExperienceLevel,
  InterviewType,
  GenerationStatus,
  QuestionDifficulty
} from "@prisma/client";

import { prisma } from "../db/prisma.js";
import type { GenerateInterviewQuestionsResult } from "../services/interview.service.js";

// Input required to persist a completed interview generation.
type SaveGenerationInput = {
  userId: string;
  jobTitle: string;
  jobDescription: string;
  experienceLevel: ExperienceLevel;
  interviewType: InterviewType;
  questionCount: number;
  result: GenerateInterviewQuestionsResult;
};

// Prisma nested writes keep the generation, questions and usage atomic.
export async function saveGeneration(input: SaveGenerationInput) {
  return prisma.generation.create({
    data: {
      userId: input.userId,
      jobTitle: input.jobTitle,
      jobDescription: input.jobDescription,
      experienceLevel: input.experienceLevel,
      interviewType: input.interviewType,
      questionCount: input.questionCount,
      provider: "gemini",
      model: input.result.model,
      promptVersion: "v1",
      status: GenerationStatus.SUCCEEDED,
      completedAt: new Date(),

      questions: {
        create: input.result.questions.map((question, index) => ({
          position: index + 1,
          question: question.question,
          category: question.category,
          difficulty: question.difficulty as QuestionDifficulty,
          evaluationCriteria: question.evaluationCriteria
        }))
      },

      usage: {
        create: {
          inputTokens: input.result.usage.inputTokens,
          outputTokens: input.result.usage.outputTokens,
          totalTokens: input.result.usage.totalTokens,
          latencyMs: input.result.latencyMs,
          providerRequestId: input.result.providerRequestId
        }
      }
    },
    include: {
      questions: {
        orderBy: {
          position: "asc"
        }
      },
      usage: true
    }
  });
}
