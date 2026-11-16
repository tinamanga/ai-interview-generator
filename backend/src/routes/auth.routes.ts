import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from "fastify";

import { env } from "../config/env.js";

import {
  authenticateUser,
  EmailAlreadyRegisteredError,
  getUserById,
  registerUser
} from "../services/auth.service.js";

import {
  createRefreshSession,
  REFRESH_COOKIE_MAX_AGE_SECONDS,
  revokeRefreshToken,
  rotateRefreshToken
} from "../services/session.service.js";

import {
  loginSchema,
  registerSchema
} from "../schemas/auth.schema.js";

const REFRESH_COOKIE_NAME = "refresh_token";
const AUTH_COOKIE_PATH = "/api/v1/auth";

const isProduction = env.NODE_ENV === "production";

const refreshCookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? "none" as const : "lax" as const,
  path: AUTH_COOKIE_PATH,
  maxAge: REFRESH_COOKIE_MAX_AGE_SECONDS
};

function setRefreshCookie(reply: FastifyReply, token: string): void {
  reply.setCookie(
    REFRESH_COOKIE_NAME,
    token,
    refreshCookieOptions
  );
}

function clearRefreshCookie(reply: FastifyReply): void {
  reply.clearCookie(REFRESH_COOKIE_NAME, {
    httpOnly: true,
    secure: isProduction,
    sameSite: refreshCookieOptions.sameSite,
    path: AUTH_COOKIE_PATH
  });
}

// Browser requests must originate from the configured frontend.
// Cookie-dependent endpoints require an Origin header.
function hasAllowedOrigin(
  request: FastifyRequest,
  reply: FastifyReply,
  requireOrigin = false
): boolean {
  const origin = request.headers.origin;

  if (!origin && !requireOrigin) {
    return true;
  }

  if (origin !== env.FRONTEND_URL) {
    reply.code(403).send({
      success: false,
      error: {
        code: "INVALID_ORIGIN",
        message: "This request origin is not allowed."
      }
    });

    return false;
  }

  return true;
}

function getSessionMetadata(request: FastifyRequest) {
  const userAgent = request.headers["user-agent"];

  return {
    userAgent: typeof userAgent === "string" ? userAgent : undefined,
    ipAddress: request.ip
  };
}

const authRoutes: FastifyPluginAsync = async (fastify) => {
  // Register a new account and create its first refresh session.
  fastify.post("/auth/register", {
    config: {
      rateLimit: {
        max: 5,
        timeWindow: "1 minute"
      }
    }
  }, async (request, reply) => {
    if (!hasAllowedOrigin(request, reply)) {
      return;
    }

    const validation = registerSchema.safeParse(request.body);

    if (!validation.success) {
      return reply.code(400).send({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "The registration details are invalid.",
          details: validation.error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message
          }))
        }
      });
    }

    try {
      const user = await registerUser(validation.data);

      const refreshToken = await createRefreshSession(
        user.id,
        getSessionMetadata(request)
      );

      const accessToken = fastify.jwt.sign({
        sub: user.id,
        email: user.email
      });

      setRefreshCookie(reply, refreshToken);

      return reply.code(201).send({
        success: true,
        message: "Account created successfully.",
        data: {
          user,
          accessToken
        }
      });
    } catch (error) {
      if (error instanceof EmailAlreadyRegisteredError) {
        return reply.code(409).send({
          success: false,
          error: {
            code: "EMAIL_ALREADY_REGISTERED",
            message: error.message
          }
        });
      }

      request.log.error(
        { err: error },
        "Account registration failed"
      );

      return reply.code(500).send({
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Unable to create your account at this time."
        }
      });
    }
  });

  // Authenticate an existing account and start a refresh session.
  fastify.post("/auth/login", {
    config: {
      rateLimit: {
        max: 5,
        timeWindow: "1 minute"
      }
    }
  }, async (request, reply) => {
    if (!hasAllowedOrigin(request, reply)) {
      return;
    }

    const validation = loginSchema.safeParse(request.body);

    if (!validation.success) {
      return reply.code(400).send({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "The login details are invalid.",
          details: validation.error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message
          }))
        }
      });
    }

    try {
      const user = await authenticateUser(validation.data);

      if (!user) {
        return reply.code(401).send({
          success: false,
          error: {
            code: "INVALID_CREDENTIALS",
            message: "The email address or password is incorrect."
          }
        });
      }

      const refreshToken = await createRefreshSession(
        user.id,
        getSessionMetadata(request)
      );

      const accessToken = fastify.jwt.sign({
        sub: user.id,
        email: user.email
      });

      setRefreshCookie(reply, refreshToken);

      return reply.code(200).send({
        success: true,
        message: "Login successful.",
        data: {
          user,
          accessToken
        }
      });
    } catch (error) {
      request.log.error(
        { err: error },
        "Account login failed"
      );

      return reply.code(500).send({
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Unable to log in at this time."
        }
      });
    }
  });

  // Exchange a valid refresh cookie for a new access token and refresh cookie.
  fastify.post("/auth/refresh", {
    config: {
      rateLimit: {
        max: 10,
        timeWindow: "1 minute"
      }
    }
  }, async (request, reply) => {
    if (!hasAllowedOrigin(request, reply, true)) {
      return;
    }

    const currentToken = request.cookies[REFRESH_COOKIE_NAME];

    if (!currentToken) {
      clearRefreshCookie(reply);

      return reply.code(401).send({
        success: false,
        error: {
          code: "UNAUTHENTICATED",
          message: "Your session has expired. Please log in again."
        }
      });
    }

    try {
      const result = await rotateRefreshToken(
        currentToken,
        getSessionMetadata(request)
      );

      if (!result) {
        clearRefreshCookie(reply);

        return reply.code(401).send({
          success: false,
          error: {
            code: "INVALID_REFRESH_TOKEN",
            message: "Your session is no longer valid. Please log in again."
          }
        });
      }

      const accessToken = fastify.jwt.sign({
        sub: result.user.id,
        email: result.user.email
      });

      setRefreshCookie(reply, result.refreshToken);

      return reply.code(200).send({
        success: true,
        message: "Session refreshed successfully.",
        data: {
          user: result.user,
          accessToken
        }
      });
    } catch (error) {
      request.log.error(
        { err: error },
        "Session refresh failed"
      );

      return reply.code(500).send({
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Unable to refresh your session at this time."
        }
      });
    }
  });

  // Revoke the current refresh session and clear the browser cookie.
  fastify.post("/auth/logout", {
    config: {
      rateLimit: {
        max: 20,
        timeWindow: "1 minute"
      }
    }
  }, async (request, reply) => {
    if (!hasAllowedOrigin(request, reply, true)) {
      return;
    }

    const refreshToken = request.cookies[REFRESH_COOKIE_NAME];

    try {
      if (refreshToken) {
        await revokeRefreshToken(refreshToken);
      }

      clearRefreshCookie(reply);

      return reply.code(200).send({
        success: true,
        message: "You have been logged out successfully."
      });
    } catch (error) {
      request.log.error(
        { err: error },
        "Account logout failed"
      );

      return reply.code(500).send({
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Unable to log out at this time."
        }
      });
    }
  });

  // Return the public profile of the currently authenticated user.
  fastify.get("/auth/me", async (request, reply) => {
    // Verify the access token before accessing the user's account.

    let userId: string;

    try {
      // Verify the token and retrieve its typed payload.
      const payload = await request.jwtVerify<{ sub?: string }>();

      if (typeof payload.sub !== "string" || !payload.sub) {
        return reply.code(401).send({
          success: false,
          error: {
            code: "UNAUTHENTICATED",
            message: "A valid access token is required."
          }
        });
      }

      userId = payload.sub;
    } catch {
      return reply.code(401).send({
        success: false,
        error: {
          code: "UNAUTHENTICATED",
          message: "A valid access token is required."
        }
      });
    }



    try {
      const user = await getUserById(userId);

      if (!user) {
        return reply.code(401).send({
          success: false,
          error: {
            code: "UNAUTHENTICATED",
            message: "The account associated with this session no longer exists."
          }
        });
      }

      return reply.code(200).send({
        success: true,
        data: {
          user
        }
      });
    } catch (error) {
      request.log.error(
        { err: error },
        "Unable to retrieve authenticated user"
      );

      return reply.code(500).send({
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Unable to retrieve your account at this time."
        }
      });
    }
  });

};

export default authRoutes;
