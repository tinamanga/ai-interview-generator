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

// Mock repository functions so these tests never access the database.
const mocks = vi.hoisted(() => ({
  bookmarkUserGeneration: vi.fn(),
  removeUserGenerationBookmark: vi.fn(),
  listUserGenerationBookmarks: vi.fn()
}));

vi.mock("../src/repositories/interview.repository.js", () => ({
  saveGeneration: vi.fn(),
  listUserGenerations: vi.fn(),
  findUserGenerationById: vi.fn(),
  bookmarkUserGeneration: mocks.bookmarkUserGeneration,
  removeUserGenerationBookmark: mocks.removeUserGenerationBookmark,
  listUserGenerationBookmarks: mocks.listUserGenerationBookmarks
}));

vi.mock("../src/services/interview.service.js", () => ({
  generateInterviewQuestions: vi.fn()
}));

import interviewRoutes from "../src/routes/interview.routes.js";

describe("Interview bookmark routes", () => {
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

  const bookmark = {
    id: "55555555-5555-4555-8555-555555555555",
    generationId: interviewId,
    createdAt: new Date("2026-11-17T10:00:00.000Z")
  };

  const mockBookmarkedInterview = {
    id: bookmark.id,
    createdAt: bookmark.createdAt,
    generation: {
      id: interviewId,
      jobTitle: "Junior Backend Developer",
      experienceLevel: "JUNIOR",
      interviewType: "TECHNICAL",
      questionCount: 3,
      createdAt: new Date("2026-11-17T09:00:00.000Z"),
      completedAt: new Date("2026-11-17T09:01:00.000Z"),
      _count: {
        questions: 3
      }
    }
  };

  const getAuthHeaders = (user = userA) => ({
    authorization: `Bearer ${app.jwt.sign({
      sub: user.id,
      email: user.email
    })}`
  });

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

  describe("POST /api/v1/interviews/:id/bookmark", () => {
    it("rejects requests without an access token", async () => {
      const response = await app.inject({
        method: "POST",
        url: `/api/v1/interviews/${interviewId}/bookmark`
      });

      expect(response.statusCode).toBe(401);
      expect(response.json().error.code).toBe("UNAUTHENTICATED");

      expect(mocks.bookmarkUserGeneration).not.toHaveBeenCalled();
    });

    it("rejects malformed interview IDs", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/api/v1/interviews/not-a-uuid/bookmark",
        headers: getAuthHeaders()
      });

      expect(response.statusCode).toBe(400);
      expect(response.json().error.code).toBe("VALIDATION_ERROR");

      expect(mocks.bookmarkUserGeneration).not.toHaveBeenCalled();
    });

    it("bookmarks an interview belonging to the authenticated user", async () => {
      mocks.bookmarkUserGeneration.mockResolvedValue(bookmark);

      const response = await app.inject({
        method: "POST",
        url: `/api/v1/interviews/${interviewId}/bookmark`,
        headers: getAuthHeaders(userA)
      });

      expect(response.statusCode).toBe(200);

      const body = response.json();

      expect(body.success).toBe(true);
      expect(body.data.generationId).toBe(interviewId);

      expect(mocks.bookmarkUserGeneration).toHaveBeenCalledWith(
        userA.id,
        interviewId
      );
    });

    it("handles repeated bookmark requests safely", async () => {
      mocks.bookmarkUserGeneration.mockResolvedValue(bookmark);

      const firstResponse = await app.inject({
        method: "POST",
        url: `/api/v1/interviews/${interviewId}/bookmark`,
        headers: getAuthHeaders()
      });

      const secondResponse = await app.inject({
        method: "POST",
        url: `/api/v1/interviews/${interviewId}/bookmark`,
        headers: getAuthHeaders()
      });

      expect(firstResponse.statusCode).toBe(200);
      expect(secondResponse.statusCode).toBe(200);

      expect(firstResponse.json().data.id).toBe(
        secondResponse.json().data.id
      );

      expect(mocks.bookmarkUserGeneration).toHaveBeenCalledTimes(2);
    });

    it("returns 404 when the interview does not exist or belong to the user", async () => {
      mocks.bookmarkUserGeneration.mockResolvedValue(null);

      const response = await app.inject({
        method: "POST",
        url: `/api/v1/interviews/${interviewId}/bookmark`,
        headers: getAuthHeaders(userB)
      });

      expect(response.statusCode).toBe(404);
      expect(response.json().error.code).toBe("INTERVIEW_NOT_FOUND");

      expect(mocks.bookmarkUserGeneration).toHaveBeenCalledWith(
        userB.id,
        interviewId
      );
    });

    it("does not expose internal errors", async () => {
      mocks.bookmarkUserGeneration.mockRejectedValue(
        new Error("Sensitive database connection information")
      );

      const response = await app.inject({
        method: "POST",
        url: `/api/v1/interviews/${interviewId}/bookmark`,
        headers: getAuthHeaders()
      });

      expect(response.statusCode).toBe(500);
      expect(response.json().error.code).toBe("INTERNAL_SERVER_ERROR");

      expect(response.body).not.toContain(
        "Sensitive database connection information"
      );
    });
  });

  describe("DELETE /api/v1/interviews/:id/bookmark", () => {
    it("rejects requests without an access token", async () => {
      const response = await app.inject({
        method: "DELETE",
        url: `/api/v1/interviews/${interviewId}/bookmark`
      });

      expect(response.statusCode).toBe(401);
      expect(response.json().error.code).toBe("UNAUTHENTICATED");

      expect(mocks.removeUserGenerationBookmark).not.toHaveBeenCalled();
    });

    it("rejects malformed interview IDs", async () => {
      const response = await app.inject({
        method: "DELETE",
        url: "/api/v1/interviews/not-a-uuid/bookmark",
        headers: getAuthHeaders()
      });

      expect(response.statusCode).toBe(400);
      expect(response.json().error.code).toBe("VALIDATION_ERROR");

      expect(mocks.removeUserGenerationBookmark).not.toHaveBeenCalled();
    });

    it("removes an existing bookmark", async () => {
      mocks.removeUserGenerationBookmark.mockResolvedValue(1);

      const response = await app.inject({
        method: "DELETE",
        url: `/api/v1/interviews/${interviewId}/bookmark`,
        headers: getAuthHeaders()
      });

      expect(response.statusCode).toBe(200);
      expect(response.json().success).toBe(true);
      expect(response.json().data.removed).toBe(true);

      expect(mocks.removeUserGenerationBookmark).toHaveBeenCalledWith(
        userA.id,
        interviewId
      );
    });

    it("succeeds when the bookmark has already been removed", async () => {
      mocks.removeUserGenerationBookmark.mockResolvedValue(0);

      const response = await app.inject({
        method: "DELETE",
        url: `/api/v1/interviews/${interviewId}/bookmark`,
        headers: getAuthHeaders()
      });

      expect(response.statusCode).toBe(200);
      expect(response.json().success).toBe(true);
      expect(response.json().data.removed).toBe(false);
    });

    it("returns 404 when the interview does not exist or belong to the user", async () => {
      mocks.removeUserGenerationBookmark.mockResolvedValue(null);

      const response = await app.inject({
        method: "DELETE",
        url: `/api/v1/interviews/${interviewId}/bookmark`,
        headers: getAuthHeaders(userB)
      });

      expect(response.statusCode).toBe(404);
      expect(response.json().error.code).toBe("INTERVIEW_NOT_FOUND");
    });

    it("does not expose internal errors", async () => {
      mocks.removeUserGenerationBookmark.mockRejectedValue(
        new Error("Sensitive database connection information")
      );

      const response = await app.inject({
        method: "DELETE",
        url: `/api/v1/interviews/${interviewId}/bookmark`,
        headers: getAuthHeaders()
      });

      expect(response.statusCode).toBe(500);
      expect(response.json().error.code).toBe("INTERNAL_SERVER_ERROR");

      expect(response.body).not.toContain(
        "Sensitive database connection information"
      );
    });
  });

  describe("GET /api/v1/interviews/bookmarks", () => {
    it("rejects requests without an access token", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/api/v1/interviews/bookmarks"
      });

      expect(response.statusCode).toBe(401);
      expect(response.json().error.code).toBe("UNAUTHENTICATED");

      expect(mocks.listUserGenerationBookmarks).not.toHaveBeenCalled();
    });

    it("returns the authenticated user's paginated bookmarks", async () => {
      mocks.listUserGenerationBookmarks.mockResolvedValue({
        bookmarks: [mockBookmarkedInterview],
        total: 21
      });

      const response = await app.inject({
        method: "GET",
        url: "/api/v1/interviews/bookmarks?page=2&limit=10",
        headers: getAuthHeaders(userA)
      });

      expect(response.statusCode).toBe(200);

      const body = response.json();

      expect(body.success).toBe(true);
      expect(body.data.bookmarks).toHaveLength(1);

      expect(body.data.pagination).toEqual({
        page: 2,
        limit: 10,
        total: 21,
        totalPages: 3
      });

      expect(mocks.listUserGenerationBookmarks).toHaveBeenCalledWith(
        userA.id,
        2,
        10
      );
    });

    it("uses default pagination values", async () => {
      mocks.listUserGenerationBookmarks.mockResolvedValue({
        bookmarks: [],
        total: 0
      });

      const response = await app.inject({
        method: "GET",
        url: "/api/v1/interviews/bookmarks",
        headers: getAuthHeaders()
      });

      expect(response.statusCode).toBe(200);

      expect(mocks.listUserGenerationBookmarks).toHaveBeenCalledWith(
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
        url: "/api/v1/interviews/bookmarks?page=0&limit=100",
        headers: getAuthHeaders()
      });

      expect(response.statusCode).toBe(400);
      expect(response.json().error.code).toBe("VALIDATION_ERROR");

      expect(mocks.listUserGenerationBookmarks).not.toHaveBeenCalled();
    });

    it("uses the authenticated user's ID when listing bookmarks", async () => {
      mocks.listUserGenerationBookmarks.mockResolvedValue({
        bookmarks: [],
        total: 0
      });

      const response = await app.inject({
        method: "GET",
        url: "/api/v1/interviews/bookmarks",
        headers: getAuthHeaders(userB)
      });

      expect(response.statusCode).toBe(200);

      expect(mocks.listUserGenerationBookmarks).toHaveBeenCalledWith(
        userB.id,
        1,
        10
      );
    });

    it("does not expose internal errors", async () => {
      mocks.listUserGenerationBookmarks.mockRejectedValue(
        new Error("Sensitive database connection information")
      );

      const response = await app.inject({
        method: "GET",
        url: "/api/v1/interviews/bookmarks",
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
