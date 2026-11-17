import {
  ExperienceLevel,
  InterviewType,
  GenerationStatus,
  QuestionDifficulty
} from "@prisma/client";

import { prisma } from "../db/prisma.js";
import type { GenerateInterviewQuestionsResult } from "../services/interview.service.js";
import type { InterviewHistoryQuery } from "../schemas/interview.schema.js";

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

// Returns a paginated list of successful interviews belonging to one user.
export async function listUserGenerations(
  userId: string,
  page: number,
  limit: number,
  filters: Pick<InterviewHistoryQuery, "search" | "interviewType" | "experienceLevel"> = {}
) {
  const skip = (page - 1) * limit;

  // Use the same conditions for both records and count so pagination
  // reflects the filtered results rather than the full history.
  const where = {
    userId,
    status: GenerationStatus.SUCCEEDED,
    ...(filters.search
      ? {
          jobTitle: {
            contains: filters.search,
            mode: "insensitive" as const
          }
        }
      : {}),
    ...(filters.interviewType
      ? { interviewType: filters.interviewType }
      : {}),
    ...(filters.experienceLevel
      ? { experienceLevel: filters.experienceLevel }
      : {})
  };

  const [interviews, total] = await prisma.$transaction([
    prisma.generation.findMany({
      where,
      orderBy: {
        createdAt: "desc"
      },
      skip,
      take: limit,
      select: {
        id: true,
        jobTitle: true,
        experienceLevel: true,
        interviewType: true,
        questionCount: true,
        createdAt: true,
        completedAt: true,
        _count: {
          select: {
            questions: true
          }
        }
      }
    }),
    prisma.generation.count({
      where
    })
  ]);

  return { interviews, total };
}

// Returns one interview only when it belongs to the requesting user.
export async function findUserGenerationById(
  userId: string,
  generationId: string
) {
  return prisma.generation.findFirst({
    where: {
      id: generationId,
      userId,
      status: GenerationStatus.SUCCEEDED
    },
    select: {
      id: true,
      jobTitle: true,
      jobDescription: true,
      experienceLevel: true,
      interviewType: true,
      questionCount: true,
      createdAt: true,
      completedAt: true,
      questions: {
        orderBy: {
          position: "asc"
        },
        select: {
          id: true,
          position: true,
          question: true,
          category: true,
          difficulty: true,
          evaluationCriteria: true,
          createdAt: true
        }
      }
    }
  });
}
