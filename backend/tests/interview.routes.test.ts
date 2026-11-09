import {
    afterEach,
    beforeEach,
    describe,
    expect,
    it,
    vi
  } from "vitest";
  
  import Fastify, { type FastifyInstance } from "fastify";
  
  // Create mock functions that can be shared with Vitest mocks.
  const mocks = vi.hoisted(() => ({
    generateInterviewQuestions: vi.fn(),
    saveGeneration: vi.fn()
  }));
  
  // Mock the Gemini generation service.
  vi.mock("../src/services/interview.service.js", () => ({
    generateInterviewQuestions: mocks.generateInterviewQuestions
  }));
  
  // Mock the database repository.
  vi.mock("../src/repositories/interview.repository.js", () => ({
    saveGeneration: mocks.saveGeneration
  }));
  
  import interviewRoutes from "../src/routes/interview.routes.js";
  import { GeminiIntegrationError } from "../src/integrations/gemini/gemini.errors.js";
  
  describe("Interview generation routes", () => {
    let app: FastifyInstance;
  
    // Valid request used by the successful generation test.
    const validPayload = {
      jobTitle: "Junior Backend Developer",
      jobDescription:
        "We are looking for a backend developer with experience building REST APIs and working with databases.",
      experienceLevel: "JUNIOR",
      interviewType: "TECHNICAL",
      questionCount: 3
    };
  
    // Mock result returned by the Gemini service.
    const mockGenerationResult = {
      questions: [
        {
          question: "What is a REST API?",
          category: "API Development",
          difficulty: "EASY",
          evaluationCriteria: "Explain REST principles and HTTP methods."
        },
        {
          question: "How does authentication work using JWT?",
          category: "Security",
          difficulty: "MEDIUM",
          evaluationCriteria: "Explain token creation, validation and expiration."
        },
        {
          question: "How would you optimize a slow database query?",
          category: "Database",
          difficulty: "MEDIUM",
          evaluationCriteria: "Discuss indexing and query optimization."
        }
      ],
      usage: {
        inputTokens: 300,
        outputTokens: 250,
        totalTokens: 550
      },
      model: "gemini-3.5-flash-lite",
      latencyMs: 1800,
      providerRequestId: "test-request-123"
    };
  
    // Mock record returned after saving to the database.
    const mockSavedGeneration = {
      id: "generation-test-123",
      jobTitle: validPayload.jobTitle,
      status: "SUCCEEDED",
      questions: mockGenerationResult.questions,
      usage: mockGenerationResult.usage
    };
  
    beforeEach(async () => {
      vi.clearAllMocks();
  
      // Create a fresh Fastify instance for every test.
      app = Fastify({ logger: false });
  
      await app.register(interviewRoutes, {
        prefix: "/api/v1"
      });
  
      await app.ready();
    });
  
    afterEach(async () => {
      await app.close();
    });
  
    describe("POST /api/v1/interviews/generate", () => {
      it("returns 400 when the request contains invalid data", async () => {
        const response = await app.inject({
          method: "POST",
          url: "/api/v1/interviews/generate",
          payload: {
            jobTitle: "A",
            experienceLevel: "JUNIOR",
            interviewType: "TECHNICAL",
            questionCount: 3
          }
        });
  
        expect(response.statusCode).toBe(400);
  
        const body = response.json();
  
        expect(body.success).toBe(false);
        expect(body.error.code).toBe("VALIDATION_ERROR");
  
        // Invalid requests must not reach Gemini or the database.
        expect(mocks.generateInterviewQuestions).not.toHaveBeenCalled();
        expect(mocks.saveGeneration).not.toHaveBeenCalled();
      });
  
      it("generates questions and saves the result successfully", async () => {
        mocks.generateInterviewQuestions.mockResolvedValue(
          mockGenerationResult
        );
  
        mocks.saveGeneration.mockResolvedValue(
          mockSavedGeneration
        );
  
        const response = await app.inject({
          method: "POST",
          url: "/api/v1/interviews/generate",
          payload: validPayload
        });
  
        expect(response.statusCode).toBe(201);
  
        const body = response.json();
  
        expect(body.success).toBe(true);
        expect(body.data.id).toBe("generation-test-123");
  
        // Confirm that the service received the validated request.
        expect(mocks.generateInterviewQuestions).toHaveBeenCalledWith(
          validPayload
        );
  
        // Confirm that the generated result was passed to the repository.
        expect(mocks.saveGeneration).toHaveBeenCalledWith({
          ...validPayload,
          result: mockGenerationResult
        });
      });
  
      it("returns the correct HTTP status when Gemini is rate limited", async () => {
        mocks.generateInterviewQuestions.mockRejectedValue(
          new GeminiIntegrationError(
            "GEMINI_RATE_LIMITED",
            "The AI provider is temporarily rate limited."
          )
        );
  
        const response = await app.inject({
          method: "POST",
          url: "/api/v1/interviews/generate",
          payload: validPayload
        });
  
        expect(response.statusCode).toBe(429);
  
        const body = response.json();
  
        expect(body.success).toBe(false);
        expect(body.error.code).toBe("GEMINI_RATE_LIMITED");
  
        // A failed Gemini request must not be saved as successful.
        expect(mocks.saveGeneration).not.toHaveBeenCalled();
      });
  
      it("does not expose database error details to the client", async () => {
        mocks.generateInterviewQuestions.mockResolvedValue(
          mockGenerationResult
        );
  
        mocks.saveGeneration.mockRejectedValue(
          new Error("Sensitive database connection information")
        );
  
        const response = await app.inject({
          method: "POST",
          url: "/api/v1/interviews/generate",
          payload: validPayload
        });
  
        expect(response.statusCode).toBe(500);
  
        const body = response.json();
  
        expect(body.success).toBe(false);
        expect(body.error.code).toBe("INTERNAL_SERVER_ERROR");
  
        // Internal database details must never appear in the response.
        expect(response.body).not.toContain(
          "Sensitive database connection information"
        );
      });
    });
  });