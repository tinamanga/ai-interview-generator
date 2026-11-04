
import "dotenv/config";
import { z } from "zod";

// Validate configuration once when the application starts.
// Invalid configuration should stop the application instead of
// allowing it to run with missing or unsafe settings.
const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),

  PORT: z.coerce.number().int().min(1).max(65535).default(5000),

  DATABASE_URL: z.string().min(1),

  FRONTEND_URL: z.string().url().default("http://localhost:3000"),

  // These are optional until the Gemini integration is configured.
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().optional()
});

export const env = envSchema.parse(process.env);
