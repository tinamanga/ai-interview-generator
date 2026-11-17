
import {
    afterEach,
    beforeEach,
    describe,
    expect,
    it,
    vi
  } from "vitest";
  
  import Fastify, { type FastifyInstance } from "fastify";
  import jwt from "@fastify/jwt";
  import rateLimit from "@fastify/rate-limit";
  
  // Mock repository functions to avoid accessing the production database.
  const mocks = vi.hoisted(() => ({
    listUserGenerations: vi.fn(),
    findUserGenerationById: vi.fn()
  }));
  
  vi.mock("../src/repositories/interview.repository.js", () => ({
    saveGeneration: vi.fn(),
    listUserGenerations: mocks.listUserGenerations,
    findUserGenerationById: mocks.findUserGenerationById
  }));
  
  vi.mock("../src/services/interview.service.js", () => ({
    generateInterviewQuestions: vi.fn()
  }));
  
  import interviewRoutes from "../src/routes/interview.routes.js";
  
  describe("Interview history routes", () => {
    let app: FastifyInstance;
  
    const userA = {
      id: "11111111-1111-4111-8111-111111111111",
      email: "usera@example.com"
    };
  
    const userB = {
      id: "22222222-2222-4222-8222-222222222222",
      email: "userb@example.com"
    };
  
    const interviewId = "33333333-3333-4333-8333-333333333333";
  
    const getAuthHeaders = (user = userA) => ({
      authorization: `Bearer ${app.jwt.sign({
        sub: user.id,
        email: user.email
      })}`
    });
  
    const mockInterview = {
      id: interviewId,
      jobTitle: "Junior Backend Developer",
      experienceLevel: "JUNIOR",
      interviewType: "TECHNICAL",
      questionCount: 3,
      createdAt: new Date("2026-11-17T10:00:00.000Z"),
      completedAt: new Date("2026-11-17T10:01:00.000Z"),
      _count: {
        questions: 3
      }
    };
  
    const mockInterviewDetails = {
      id: interviewId,
      jobTitle: "Junior Backend Developer",
      jobDescription: "A backend developer role requiring API and database skills.",
      experienceLevel: "JUNIOR",
      interviewType: "TECHNICAL",
      questionCount: 1,
      createdAt: new Date("2026-11-17T10:00:00.000Z"),
      completedAt: new Date("2026-11-17T10:01:00.000Z"),
      questions: [
        {
          id: "44444444-4444-4444-8444-444444444444",
          position: 1,
          question: "What is a REST API?",
          category: "API Development",
          difficulty: "EASY",
          evaluationCriteria: "Explain REST principles and HTTP methods.",
          createdAt: new Date("2026-11-17T10:00:00.000Z")
        }
      ]
    };
  
    beforeEach(async () => {
      vi.clearAllMocks();
  
      app = Fastify({ logger: false });
  
      await app.register(rateLimit, {
        max: 100,
        timeWindow: "1 minute"
      });
  
      await app.register(jwt, {
        secret: "test-only-secret-with-at-least-32-characters",
        sign: {
          expiresIn: "15m"
        }
      });
  
      await app.register(interviewRoutes, {
        prefix: "/api/v1"
      });
  
      await app.ready();
    });
  
    afterEach(async () => {
      await app.close();
    });
  
    describe("GET /api/v1/interviews", () => {
      it("rejects requests without an access token", async () => {
        const response = await app.inject({
          method: "GET",
          url: "/api/v1/interviews"
        });
  
        expect(response.statusCode).toBe(401);
        expect(response.json().error.code).toBe("UNAUTHENTICATED");
  
        expect(mocks.listUserGenerations).not.toHaveBeenCalled();
      });
  
      it("returns the authenticated user's paginated interview history", async () => {
        mocks.listUserGenerations.mockResolvedValue({
          interviews: [mockInterview],
          total: 21
        });
  
        const response = await app.inject({
          method: "GET",
          url: "/api/v1/interviews?page=2&limit=10",
          headers: getAuthHeaders(userA)
        });
  
        expect(response.statusCode).toBe(200);
  
        const body = response.json();
  
        expect(body.success).toBe(true);
        expect(body.data.interviews).toHaveLength(1);
        expect(body.data.pagination).toEqual({
          page: 2,
          limit: 10,
          total: 21,
          totalPages: 3
        });
  
        expect(mocks.listUserGenerations).toHaveBeenCalledWith(
          userA.id,
          2,
          10
        );
      });
  
      it("uses default pagination values when none are provided", async () => {
        mocks.listUserGenerations.mockResolvedValue({
          interviews: [],
          total: 0
        });
  
        const response = await app.inject({
          method: "GET",
          url: "/api/v1/interviews",
          headers: getAuthHeaders()
        });
  
        expect(response.statusCode).toBe(200);
  
        expect(mocks.listUserGenerations).toHaveBeenCalledWith(
          userA.id,
          1,
          10
        );
  
        expect(response.json().data.pagination).toEqual({
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0
        });
      });
  
      it("rejects invalid pagination parameters", async () => {
        const response = await app.inject({
          method: "GET",
          url: "/api/v1/interviews?page=0&limit=100",
          headers: getAuthHeaders()
        });
  
        expect(response.statusCode).toBe(400);
        expect(response.json().error.code).toBe("VALIDATION_ERROR");
  
        expect(mocks.listUserGenerations).not.toHaveBeenCalled();
      });
  
      it("passes the authenticated user's ID to the repository", async () => {
        mocks.listUserGenerations.mockResolvedValue({
          interviews: [],
          total: 0
        });
  
        const response = await app.inject({
          method: "GET",
          url: "/api/v1/interviews",
          headers: getAuthHeaders(userB)
        });
  
        expect(response.statusCode).toBe(200);
  
        expect(mocks.listUserGenerations).toHaveBeenCalledWith(
          userB.id,
          1,
          10
        );
      });
  
      it("does not expose database errors", async () => {
        mocks.listUserGenerations.mockRejectedValue(
          new Error("Sensitive database connection information")
        );
  
        const response = await app.inject({
          method: "GET",
          url: "/api/v1/interviews",
          headers: getAuthHeaders()
        });
  
        expect(response.statusCode).toBe(500);
        expect(response.json().error.code).toBe("INTERNAL_SERVER_ERROR");
  
        expect(response.body).not.toContain(
          "Sensitive database connection information"
        );
      });
    });
  
    describe("GET /api/v1/interviews/:id", () => {
      it("rejects requests without an access token", async () => {
        const response = await app.inject({
          method: "GET",
          url: `/api/v1/interviews/${interviewId}`
        });
  
        expect(response.statusCode).toBe(401);
        expect(response.json().error.code).toBe("UNAUTHENTICATED");
  
        expect(mocks.findUserGenerationById).not.toHaveBeenCalled();
      });
  
      it("returns a saved interview belonging to the authenticated user", async () => {
        mocks.findUserGenerationById.mockResolvedValue(
          mockInterviewDetails
        );
  
        const response = await app.inject({
          method: "GET",
          url: `/api/v1/interviews/${interviewId}`,
          headers: getAuthHeaders(userA)
        });
  
        expect(response.statusCode).toBe(200);
  
        const body = response.json();
  
        expect(body.success).toBe(true);
        expect(body.data.id).toBe(interviewId);
        expect(body.data.questions).toHaveLength(1);
        expect(body.data.questions[0].question).toBe(
          "What is a REST API?"
        );
  
        expect(mocks.findUserGenerationById).toHaveBeenCalledWith(
          userA.id,
          interviewId
        );
      });
  
      it("does not return an interview that does not belong to the user", async () => {
        // The repository returns null when the ID is not owned by user B.
        mocks.findUserGenerationById.mockResolvedValue(null);
  
        const response = await app.inject({
          method: "GET",
          url: `/api/v1/interviews/${interviewId}`,
          headers: getAuthHeaders(userB)
        });
  
        expect(response.statusCode).toBe(404);
        expect(response.json().error.code).toBe("INTERVIEW_NOT_FOUND");
  
        expect(mocks.findUserGenerationById).toHaveBeenCalledWith(
          userB.id,
          interviewId
        );
      });
  
      it("rejects malformed interview IDs", async () => {
        const response = await app.inject({
          method: "GET",
          url: "/api/v1/interviews/not-a-uuid",
          headers: getAuthHeaders()
        });
  
        expect(response.statusCode).toBe(400);
        expect(response.json().error.code).toBe("VALIDATION_ERROR");
  
        expect(mocks.findUserGenerationById).not.toHaveBeenCalled();
      });
  
      it("returns 404 when the interview does not exist", async () => {
        mocks.findUserGenerationById.mockResolvedValue(null);
  
        const response = await app.inject({
          method: "GET",
          url: `/api/v1/interviews/${interviewId}`,
          headers: getAuthHeaders()
        });
  
        expect(response.statusCode).toBe(404);
        expect(response.json().error.code).toBe("INTERVIEW_NOT_FOUND");
      });
  
      it("does not expose database errors", async () => {
        mocks.findUserGenerationById.mockRejectedValue(
          new Error("Sensitive database connection information")
        );
  
        const response = await app.inject({
          method: "GET",
          url: `/api/v1/interviews/${interviewId}`,
          headers: getAuthHeaders()
        });
  
        expect(response.statusCode).toBe(500);
        expect(response.json().error.code).toBe("INTERNAL_SERVER_ERROR");
  
        expect(response.body).not.toContain(
          "Sensitive database connection information"
        );
      });
    });
  });
  