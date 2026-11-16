import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi
} from "vitest";

import Fastify, { type FastifyInstance } from "fastify";
import cookie from "@fastify/cookie";
import rateLimit from "@fastify/rate-limit";
import jwt from "@fastify/jwt";

const mocks = vi.hoisted(() => ({
  registerUser: vi.fn(),
  authenticateUser: vi.fn(),
  createRefreshSession: vi.fn(),
  rotateRefreshToken: vi.fn(),
  revokeRefreshToken: vi.fn()
}));

vi.mock("../src/services/auth.service.js", () => ({
  registerUser: mocks.registerUser,
  authenticateUser: mocks.authenticateUser,
  EmailAlreadyRegisteredError: class EmailAlreadyRegisteredError extends Error {}
}));

vi.mock("../src/services/session.service.js", () => ({
  createRefreshSession: mocks.createRefreshSession,
  rotateRefreshToken: mocks.rotateRefreshToken,
  revokeRefreshToken: mocks.revokeRefreshToken,
  REFRESH_COOKIE_MAX_AGE_SECONDS: 30 * 24 * 60 * 60
}));

import authRoutes from "../src/routes/auth.routes.js";

describe("Authentication routes", () => {
  let app: FastifyInstance;

  const frontendOrigin = "http://localhost:3000";

  const validUser = {
    id: "user-test-123",
    email: "test@example.com",
    createdAt: new Date("2026-11-16T07:00:00.000Z")
  };

  const validCredentials = {
    email: "test@example.com",
    password: "A-secure-test-password-123"
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    app = Fastify({ logger: false });

    await app.register(cookie);

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

    await app.register(authRoutes, {
      prefix: "/api/v1"
    });

    await app.ready();
  });

  afterEach(async () => {
    await app.close();
  });

  describe("POST /api/v1/auth/register", () => {
    it("creates an account, issues an access token and sets a refresh cookie", async () => {
      mocks.registerUser.mockResolvedValue(validUser);
      mocks.createRefreshSession.mockResolvedValue("test-refresh-token");

      const response = await app.inject({
        method: "POST",
        url: "/api/v1/auth/register",
        headers: {
          origin: frontendOrigin
        },
        payload: validCredentials
      });

      expect(response.statusCode).toBe(201);

      const body = response.json();

      expect(body.success).toBe(true);
      expect(body.data.user.email).toBe(validUser.email);
      expect(body.data.user.id).toBe(validUser.id);
      expect(body.data.accessToken).toBeTypeOf("string");
      expect(body.data.user.passwordHash).toBeUndefined();
      expect(body.data).not.toHaveProperty("refreshToken");

      expect(mocks.registerUser).toHaveBeenCalledWith(
        validCredentials
      );

      expect(mocks.createRefreshSession).toHaveBeenCalledWith(
        validUser.id,
        expect.objectContaining({
          ipAddress: expect.any(String)
        })
      );

      const token = await app.jwt.verify(body.data.accessToken);

      expect(token.sub).toBe(validUser.id);
      expect(token.email).toBe(validUser.email);

      const setCookie = response.headers["set-cookie"];

      expect(setCookie).toContain("refresh_token=test-refresh-token");
      expect(setCookie).toContain("HttpOnly");
      expect(setCookie).toContain("Path=/api/v1/auth");
    });

    it("rejects invalid registration details", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/api/v1/auth/register",
        payload: {
          email: "not-an-email",
          password: "short"
        }
      });

      expect(response.statusCode).toBe(400);
      expect(response.json().error.code).toBe("VALIDATION_ERROR");
      expect(mocks.registerUser).not.toHaveBeenCalled();
    });

    it("returns 409 when the email is already registered", async () => {
      const { EmailAlreadyRegisteredError } = await import(
        "../src/services/auth.service.js"
      );

      mocks.registerUser.mockRejectedValue(
        new EmailAlreadyRegisteredError()
      );

      const response = await app.inject({
        method: "POST",
        url: "/api/v1/auth/register",
        headers: {
          origin: frontendOrigin
        },
        payload: validCredentials
      });

      expect(response.statusCode).toBe(409);
      expect(response.json().error.code).toBe(
        "EMAIL_ALREADY_REGISTERED"
      );
    });

    it("rejects an unexpected browser origin", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/api/v1/auth/register",
        headers: {
          origin: "https://untrusted.example"
        },
        payload: validCredentials
      });

      expect(response.statusCode).toBe(403);
      expect(response.json().error.code).toBe("INVALID_ORIGIN");
      expect(mocks.registerUser).not.toHaveBeenCalled();
    });
  });

  describe("POST /api/v1/auth/login", () => {
    it("authenticates a user and sets a refresh cookie", async () => {
      mocks.authenticateUser.mockResolvedValue(validUser);
      mocks.createRefreshSession.mockResolvedValue("login-refresh-token");

      const response = await app.inject({
        method: "POST",
        url: "/api/v1/auth/login",
        headers: {
          origin: frontendOrigin
        },
        payload: validCredentials
      });

      expect(response.statusCode).toBe(200);

      const body = response.json();

      expect(body.success).toBe(true);
      expect(body.data.user.email).toBe(validUser.email);
      expect(body.data.accessToken).toBeTypeOf("string");
      expect(body.data.user.passwordHash).toBeUndefined();
      expect(body.data).not.toHaveProperty("refreshToken");

      expect(mocks.createRefreshSession).toHaveBeenCalledWith(
        validUser.id,
        expect.any(Object)
      );

      const token = await app.jwt.verify(body.data.accessToken);

      expect(token.sub).toBe(validUser.id);

      expect(response.headers["set-cookie"]).toContain(
        "refresh_token=login-refresh-token"
      );
    });

    it("returns the same error for invalid credentials", async () => {
      mocks.authenticateUser.mockResolvedValue(null);

      const response = await app.inject({
        method: "POST",
        url: "/api/v1/auth/login",
        payload: validCredentials
      });

      expect(response.statusCode).toBe(401);
      expect(response.json().error.code).toBe("INVALID_CREDENTIALS");
      expect(response.json().error.message).toBe(
        "The email address or password is incorrect."
      );

      expect(mocks.createRefreshSession).not.toHaveBeenCalled();
    });

    it("rejects malformed login requests", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/api/v1/auth/login",
        payload: {
          email: "invalid",
          password: ""
        }
      });

      expect(response.statusCode).toBe(400);
      expect(mocks.authenticateUser).not.toHaveBeenCalled();
    });
  });

  describe("POST /api/v1/auth/refresh", () => {
    it("rotates the refresh token and returns a new access token", async () => {
      mocks.rotateRefreshToken.mockResolvedValue({
        user: validUser,
        refreshToken: "rotated-refresh-token"
      });

      const response = await app.inject({
        method: "POST",
        url: "/api/v1/auth/refresh",
        headers: {
          origin: frontendOrigin,
          cookie: "refresh_token=old-refresh-token"
        }
      });

      expect(response.statusCode).toBe(200);

      const body = response.json();

      expect(body.success).toBe(true);
      expect(body.data.user.email).toBe(validUser.email);
      expect(body.data.accessToken).toBeTypeOf("string");
      expect(body.data).not.toHaveProperty("refreshToken");

      expect(mocks.rotateRefreshToken).toHaveBeenCalledWith(
        "old-refresh-token",
        expect.any(Object)
      );

      const token = await app.jwt.verify(body.data.accessToken);

      expect(token.sub).toBe(validUser.id);

      expect(response.headers["set-cookie"]).toContain(
        "refresh_token=rotated-refresh-token"
      );
    });

    it("rejects a missing refresh cookie", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/api/v1/auth/refresh",
        headers: {
          origin: frontendOrigin
        }
      });

      expect(response.statusCode).toBe(401);
      expect(response.json().error.code).toBe("UNAUTHENTICATED");
      expect(mocks.rotateRefreshToken).not.toHaveBeenCalled();
    });

    it("rejects an invalid or expired refresh token", async () => {
      mocks.rotateRefreshToken.mockResolvedValue(null);

      const response = await app.inject({
        method: "POST",
        url: "/api/v1/auth/refresh",
        headers: {
          origin: frontendOrigin,
          cookie: "refresh_token=expired-refresh-token"
        }
      });

      expect(response.statusCode).toBe(401);
      expect(response.json().error.code).toBe("INVALID_REFRESH_TOKEN");
      expect(response.headers["set-cookie"]).toContain(
        "refresh_token="
      );
    });

    it("requires the configured frontend origin", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/api/v1/auth/refresh",
        headers: {
          origin: "https://untrusted.example",
          cookie: "refresh_token=old-refresh-token"
        }
      });

      expect(response.statusCode).toBe(403);
      expect(response.json().error.code).toBe("INVALID_ORIGIN");
      expect(mocks.rotateRefreshToken).not.toHaveBeenCalled();
    });

    it("rejects requests without an origin header", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/api/v1/auth/refresh",
        headers: {
          cookie: "refresh_token=old-refresh-token"
        }
      });

      expect(response.statusCode).toBe(403);
      expect(mocks.rotateRefreshToken).not.toHaveBeenCalled();
    });
  });

  describe("POST /api/v1/auth/logout", () => {
    it("revokes the refresh session and clears the cookie", async () => {
      mocks.revokeRefreshToken.mockResolvedValue(undefined);

      const response = await app.inject({
        method: "POST",
        url: "/api/v1/auth/logout",
        headers: {
          origin: frontendOrigin,
          cookie: "refresh_token=current-refresh-token"
        }
      });

      expect(response.statusCode).toBe(200);
      expect(response.json().success).toBe(true);

      expect(mocks.revokeRefreshToken).toHaveBeenCalledWith(
        "current-refresh-token"
      );

      const setCookie = response.headers["set-cookie"];

      expect(setCookie).toContain("refresh_token=");
      expect(setCookie).toContain("Max-Age=0");
    });

    it("clears the cookie even when no refresh token is present", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/api/v1/auth/logout",
        headers: {
          origin: frontendOrigin
        }
      });

      expect(response.statusCode).toBe(200);
      expect(mocks.revokeRefreshToken).not.toHaveBeenCalled();
      expect(response.headers["set-cookie"]).toContain(
        "refresh_token="
      );
    });

    it("rejects an unexpected origin", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/api/v1/auth/logout",
        headers: {
          origin: "https://untrusted.example",
          cookie: "refresh_token=current-refresh-token"
        }
      });

      expect(response.statusCode).toBe(403);
      expect(response.json().error.code).toBe("INVALID_ORIGIN");
      expect(mocks.revokeRefreshToken).not.toHaveBeenCalled();
    });
  });
});
