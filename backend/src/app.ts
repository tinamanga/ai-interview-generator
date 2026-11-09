
import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";

import { env } from "./config/env.js";
import healthRoutes from "./routes/health.routes.js";
import interviewRoutes from "./routes/interview.routes.js";

export async function buildApp() {
  const app = Fastify({
    logger: {
      level: env.NODE_ENV === "development" ? "debug" : "info",

      // Never include authentication credentials in logged headers.
      redact: [
        "req.headers.authorization",
        "req.headers.cookie"
      ]
    },

    // Prevent excessively large incoming JSON requests.
    bodyLimit: 1024 * 1024
  });

  // Adds security-related HTTP response headers.
  await app.register(helmet);

  // Only allow our configured frontend to access the API.
  await app.register(cors, {
    origin: env.FRONTEND_URL,
  });

  // Provides a global baseline against excessive requests.
  await app.register(rateLimit, {
    max: 100,
    timeWindow: "1 minute"
  });

  // Register versioned API routes.
  await app.register(healthRoutes, {
    prefix: "/api/v1"
  });

  await app.register(interviewRoutes, {
    prefix: "/api/v1"
  });

  return app;
}
