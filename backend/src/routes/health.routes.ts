
import type { FastifyPluginAsync } from "fastify";
import { prisma } from "../db/prisma.js";

// Health checks allow us to distinguish between an application
// that is running and one whose database is actually available.
const healthRoutes: FastifyPluginAsync = async (fastify) => {
  // Basic application health check.
  fastify.get("/health", async () => {
    return {
      success: true,
      message: "AI Interview Generator API is running",
      timestamp: new Date().toISOString()
    };
  });

  // Readiness check: verifies that PostgreSQL is reachable.
  fastify.get("/ready", async (_request, reply) => {
    try {
      await prisma.$queryRaw`SELECT 1`;

      return {
        success: true,
        database: "connected"
      };
    } catch (error) {
      // Log the internal failure without exposing database credentials.
      fastify.log.error({ err: error }, "Database readiness check failed");

      return reply.code(503).send({
        success: false,
        error: {
          code: "DATABASE_UNAVAILABLE",
          message: "The database is currently unavailable"
        }
      });
    }
  });
};

export default healthRoutes;
