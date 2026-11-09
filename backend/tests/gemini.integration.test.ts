import { describe, it, expect } from "vitest";

// Loading the environment configuration also loads the local .env file.
import "../src/config/env.js";

import { generateInterviewQuestions } from "../src/services/interview.service.js";

// This test makes a real request to Google Gemini.
// Run it explicitly using npm run test:gemini.
const shouldRunIntegrationTest =
  process.env.RUN_GEMINI_INTEGRATION === "true";

describe("Gemini integration", () => {
  it.skipIf(!shouldRunIntegrationTest)(
    "generates structured interview questions for a Junior Backend Developer",
    async () => {
      const result = await generateInterviewQuestions({
        jobTitle: "Junior Backend Developer",

        jobDescription: `
          We are looking for a Junior Backend Developer with knowledge of
          Node.js, TypeScript, PostgreSQL, REST APIs, authentication,
          error handling and Git.

          The candidate should understand API development, database
          relationships, secure authentication and basic debugging.
        `,

        experienceLevel: "JUNIOR",
        interviewType: "TECHNICAL",
        questionCount: 3
      });

      // Verify the model returned the requested number of questions.
      expect(result.questions).toHaveLength(3);

      // Verify that each question has the required structured fields.
      for (const question of result.questions) {
        expect(question.question.length).toBeGreaterThan(10);
        expect(question.category.length).toBeGreaterThan(1);
        expect(["EASY", "MEDIUM", "HARD"]).toContain(
          question.difficulty
        );
        expect(question.evaluationCriteria.length).toBeGreaterThan(10);
      }

      // Verify model and performance metadata.
      expect(result.model).toBeTruthy();
      expect(result.latencyMs).toBeGreaterThan(0);

      // Token information may be null if the provider doesn't return it.
      expect(
        result.usage.inputTokens === null ||
        result.usage.inputTokens >= 0
      ).toBe(true);

      expect(
        result.usage.outputTokens === null ||
        result.usage.outputTokens >= 0
      ).toBe(true);

      expect(
        result.usage.totalTokens === null ||
        result.usage.totalTokens >= 0
      ).toBe(true);

      // Print useful development information without exposing the API key.
      console.log("Gemini model:", result.model);
      console.log("Generation latency:", result.latencyMs, "ms");
      console.log("Token usage:", result.usage);
      console.log("Generated questions:", result.questions);
    },
    50_000
  );
});
