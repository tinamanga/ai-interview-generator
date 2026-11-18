
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
  filters: Pick<
    InterviewHistoryQuery,
    "search" | "interviewType" | "experienceLevel"
  > = {}
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

// Creates a bookmark for an interview owned by the requesting user.
// The upsert makes repeated bookmark requests safe and idempotent.
export async function bookmarkUserGeneration(
  userId: string,
  generationId: string
) {
  // Only successful interviews belonging to this user can be bookmarked.
  const generation = await prisma.generation.findFirst({
    where: {
      id: generationId,
      userId,
      status: GenerationStatus.SUCCEEDED
    },
    select: {
      id: true
    }
  });

  if (!generation) {
    return null;
  }

  // The unique constraint prevents duplicate bookmarks.
  // If one already exists, return it instead of creating another.
  return prisma.interviewBookmark.upsert({
    where: {
      userId_generationId: {
        userId,
        generationId
      }
    },
    create: {
      userId,
      generationId
    },
    update: {},
    select: {
      id: true,
      generationId: true,
      createdAt: true
    }
  });
}

// Removes a bookmark only when the interview belongs to the user.
// Returns null if the interview is not owned by the user, or the
// number of removed bookmarks (0 or 1) if ownership is confirmed.
export async function removeUserGenerationBookmark(
  userId: string,
  generationId: string
) {
  // Verify ownership first to avoid exposing another user's interviews.
  const generation = await prisma.generation.findFirst({
    where: {
      id: generationId,
      userId,
      status: GenerationStatus.SUCCEEDED
    },
    select: {
      id: true
    }
  });

  if (!generation) {
    return null;
  }

  // deleteMany makes removing a bookmark idempotent.
  const result = await prisma.interviewBookmark.deleteMany({
    where: {
      userId,
      generationId
    }
  });

  return result.count;
}

// Returns the user's bookmarks with pagination.
export async function listUserGenerationBookmarks(
  userId: string,
  page: number,
  limit: number
) {
  const skip = (page - 1) * limit;

  const where = {
    userId,
    generation: {
      status: GenerationStatus.SUCCEEDED
    }
  };

  const [bookmarks, total] = await prisma.$transaction([
    prisma.interviewBookmark.findMany({
      where,
      orderBy: {
        createdAt: "desc"
      },
      skip,
      take: limit,
      select: {
        id: true,
        createdAt: true,
        generation: {
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
        }
      }
    }),
    prisma.interviewBookmark.count({
      where
    })
  ]);

  return { bookmarks, total };
}
