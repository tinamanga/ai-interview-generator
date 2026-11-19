import Fastify from "fastify";
import cors from "@fastify/cors";
import cookie from "@fastify/cookie";
import jwt from "@fastify/jwt";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";

import { env } from "./config/env.js";
import healthRoutes from "./routes/health.routes.js";
import interviewRoutes from "./routes/interview.routes.js";
import authRoutes from "./routes/auth.routes.js";

export async function buildApp() {
  const app = Fastify({
    logger: {
      level: env.NODE_ENV === "development" ? "debug" : "info",
      redact: [
        "req.headers.authorization",
        "req.headers.cookie"
      ]
    },
    bodyLimit: 1024 * 1024
  });

  await app.register(helmet);

  // Cookie support is needed for secure, HttpOnly refresh-token cookies.
  await app.register(cookie);

  // Access tokens are short-lived to reduce the impact of token theft.
  await app.register(jwt, {
    secret: env.ACCESS_TOKEN_SECRET,
    sign: {
      expiresIn: "15m"
    }
  });

  // Only the configured frontend origin may access the API with credentials.
  await app.register(cors, {
    origin: env.FRONTEND_URL,
    credentials: true,
    methods: ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]
  });

  await app.register(rateLimit, {
    max: 100,
    timeWindow: "1 minute"
  });

  await app.register(healthRoutes, { prefix: "/api/v1" });
  await app.register(authRoutes, { prefix: "/api/v1" });
  await app.register(interviewRoutes, { prefix: "/api/v1" });

  return app;
}
