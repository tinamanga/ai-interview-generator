import type {
  FastifyPluginAsync,
  FastifyReply,
  FastifyRequest
} from "fastify";

import {
  generateInterviewSchema,
  interviewHistoryQuerySchema,
  interviewIdParamsSchema
} from "../schemas/interview.schema.js";

import { generateInterviewQuestions } from "../services/interview.service.js";

import {
  saveGeneration,
  listUserGenerations,
  findUserGenerationById
} from "../repositories/interview.repository.js";

import { GeminiIntegrationError } from "../integrations/gemini/gemini.errors.js";

// Converts known Gemini errors into appropriate HTTP status codes.
function getGeminiHttpStatus(code: GeminiIntegrationError["code"]): number {
  switch (code) {
    case "GEMINI_NOT_CONFIGURED":
    case "GEMINI_UNAVAILABLE":
      return 503;

    case "GEMINI_TIMEOUT":
      return 504;

    case "GEMINI_RATE_LIMITED":
      return 429;

    case "GEMINI_AUTH_FAILED":
    case "GEMINI_MODEL_NOT_FOUND":
    case "GEMINI_INVALID_RESPONSE":
    case "GEMINI_PROVIDER_ERROR":
      return 502;

    default:
      return 502;
  }
}

// Protect interview endpoints using the authenticated user's access token.
async function authenticateRequest(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    await request.jwtVerify();

    if (
      typeof request.user.sub !== "string" ||
      request.user.sub.length === 0
    ) {
      reply.code(401).send({
        success: false,
        error: {
          code: "UNAUTHENTICATED",
          message: "A valid access token is required."
        }
      });
      return;
    }
  } catch {
    reply.code(401).send({
      success: false,
      error: {
        code: "UNAUTHENTICATED",
        message: "A valid access token is required."
      }
    });
    return;
  }
}

const interviewRoutes: FastifyPluginAsync = async (fastify) => {

  // Retrieve the authenticated user's interview history.
  fastify.get("/interviews", {
    preHandler: authenticateRequest
  }, async (request, reply) => {
    const validation = interviewHistoryQuerySchema.safeParse(
      request.query
    );

    if (!validation.success) {
      return reply.code(400).send({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "The interview history filters are invalid.",
          details: validation.error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message
          }))
        }
      });
    }

    try {
      const {
        page,
        limit,
        search,
        interviewType,
        experienceLevel
      } = validation.data;

      const { interviews, total } = await listUserGenerations(
        request.user.sub,
        page,
        limit,
        { search, interviewType, experienceLevel }
      );

      return reply.code(200).send({
        success: true,
        data: {
          interviews,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
          }
        }
      });
    } catch (error) {
      request.log.error(
        { err: error },
        "Unable to retrieve interview history"
      );

      return reply.code(500).send({
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Unable to retrieve interview history."
        }
      });
    }
  });

  // Retrieve one saved interview belonging to the authenticated user.
  fastify.get("/interviews/:id", {
    preHandler: authenticateRequest
  }, async (request, reply) => {
    const validation = interviewIdParamsSchema.safeParse(
      request.params
    );

    if (!validation.success) {
      return reply.code(400).send({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "The interview ID is invalid.",
          details: validation.error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message
          }))
        }
      });
    }

    try {
      const interview = await findUserGenerationById(
        request.user.sub,
        validation.data.id
      );

      if (!interview) {
        return reply.code(404).send({
          success: false,
          error: {
            code: "INTERVIEW_NOT_FOUND",
            message: "The requested interview could not be found."
          }
        });
      }

      return reply.code(200).send({
        success: true,
        data: interview
      });
    } catch (error) {
      request.log.error(
        { err: error },
        "Unable to retrieve saved interview"
      );

      return reply.code(500).send({
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Unable to retrieve the saved interview."
        }
      });
    }
  });

  // Generate and save new interview questions.
  fastify.post("/interviews/generate", {
    preHandler: authenticateRequest,

    // AI generation is more expensive than ordinary API requests.
    // Apply a stricter limit to protect provider usage.
    config: {
      rateLimit: {
        max: 5,
        timeWindow: "1 minute"
      }
    }
  }, async (request, reply) => {
    // Step 1: Validate the incoming request.
    const validation = generateInterviewSchema.safeParse(request.body);

    if (!validation.success) {
      return reply.code(400).send({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "The submitted interview details are invalid.",
          details: validation.error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message
          }))
        }
      });
    }

    try {
      // Step 2: Generate interview questions using Gemini.
      const result = await generateInterviewQuestions(validation.data);

      // Step 3: Persist the generation and related records.
      const generation = await saveGeneration({
        ...validation.data,
        userId: request.user.sub,
        result
      });

      // Step 4: Return the saved interview.
      return reply.code(201).send({
        success: true,
        message: "Interview questions generated successfully.",
        data: generation
      });
    } catch (error) {
      // Handle known AI provider errors without exposing internal details.
      if (error instanceof GeminiIntegrationError) {
        const statusCode = getGeminiHttpStatus(error.code);

        request.log.warn(
          { code: error.code },
          "Interview question generation failed"
        );

        return reply.code(statusCode).send({
          success: false,
          error: {
            code: error.code,
            message: error.message
          }
        });
      }

      // Log unexpected errors for debugging without exposing them to clients.
      request.log.error(
        { err: error },
        "Unexpected interview generation error"
      );

      return reply.code(500).send({
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "An unexpected error occurred while generating interview questions."
        }
      });
    }
  });
};

export default interviewRoutes;
