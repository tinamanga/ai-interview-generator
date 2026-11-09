
import "dotenv/config";
import { z } from "zod";

// Validate configuration once when the application starts.
// Invalid configuration should stop the application instead of
// allowing it to run with missing or unsafe settings.
const envSchema = z
  .object({
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),

    PORT: z.coerce.number().int().min(1).max(65535).default(5000),

    DATABASE_URL: z.string().trim().min(1),

    FRONTEND_URL: z
      .string()
      .url()
      .default("http://localhost:3000"),

    // These can be optional during local development and testing.
    GEMINI_API_KEY: z.string().trim().min(1).optional(),

    GEMINI_MODEL: z.string().trim().min(1).optional()
  })
  .superRefine((configuration, context) => {
    // Production must have all external service configuration ready.
    if (configuration.NODE_ENV === "production") {
      if (!configuration.GEMINI_API_KEY) {
        context.addIssue({
          code: "custom",
          path: ["GEMINI_API_KEY"],
          message: "GEMINI_API_KEY is required in production."
        });
      }

      if (!configuration.GEMINI_MODEL) {
        context.addIssue({
          code: "custom",
          path: ["GEMINI_MODEL"],
          message: "GEMINI_MODEL is required in production."
        });
      }

      // Production frontend communication must use HTTPS.
      if (!configuration.FRONTEND_URL.startsWith("https://")) {
        context.addIssue({
          code: "custom",
          path: ["FRONTEND_URL"],
          message: "FRONTEND_URL must use HTTPS in production."
        });
      }
    }
  });

export const env = envSchema.parse(process.env);
