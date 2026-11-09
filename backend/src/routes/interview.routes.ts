
import type { FastifyPluginAsync } from "fastify";

import { generateInterviewSchema } from "../schemas/interview.schema.js";
import { generateInterviewQuestions } from "../services/interview.service.js";
import { saveGeneration } from "../repositories/interview.repository.js";
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

const interviewRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post("/interviews/generate", {
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
        result
      });

      // Step 4: Return the saved generation.
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
