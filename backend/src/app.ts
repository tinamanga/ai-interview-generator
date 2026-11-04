
import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";

import { env } from "./config/env.js";
import healthRoutes from "./routes/health.routes.js";

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
    credentials: true
  });

  // Provides a global baseline against excessive requests.
  // Generation endpoints will receive stricter limits later.
  await app.register(rateLimit, {
    max: 100,
    timeWindow: "1 minute"
  });

  // Keep API endpoints versioned to support future API changes.
  await app.register(healthRoutes, {
    prefix: "/api/v1"
  });

  return app;
}
