import { createHash, randomBytes, randomUUID } from "node:crypto";

import { prisma } from "../db/prisma.js";

const REFRESH_TOKEN_LIFETIME_MS =
  30 * 24 * 60 * 60 * 1000;

export const REFRESH_COOKIE_MAX_AGE_SECONDS =
  REFRESH_TOKEN_LIFETIME_MS / 1000;

type SessionMetadata = {
  userAgent?: string;
  ipAddress?: string;
};

function hashRefreshToken(token: string): string {
  return createHash("sha256")
    .update(token)
    .digest("hex");
}

function createRawRefreshToken(): string {
  return randomBytes(32).toString("base64url");
}

// Create a new refresh session and return the raw token only once.
// The database stores its SHA-256 hash, not the original token.
export async function createRefreshSession(
  userId: string,
  metadata: SessionMetadata
): Promise<string> {
  const refreshToken = createRawRefreshToken();

  await prisma.refreshSession.create({
    data: {
      userId,
      tokenHash: hashRefreshToken(refreshToken),
      tokenFamilyId: randomUUID(),
      expiresAt: new Date(
        Date.now() + REFRESH_TOKEN_LIFETIME_MS
      ),
      userAgent: metadata.userAgent?.slice(0, 500),
      ipAddress: metadata.ipAddress?.slice(0, 45)
    }
  });

  return refreshToken;
}

// Rotate a refresh token. A token can successfully be used only once.
export async function rotateRefreshToken(
  currentToken: string,
  metadata: SessionMetadata
) {
  const currentHash = hashRefreshToken(currentToken);

  const session = await prisma.refreshSession.findUnique({
    where: {
      tokenHash: currentHash
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          createdAt: true
        }
      }
    }
  });

  if (!session) {
    return null;
  }

  const now = new Date();

  // Reusing a revoked token indicates possible token theft.
  // Revoke every still-active session in that token family.
  if (session.revokedAt) {
    await prisma.refreshSession.updateMany({
      where: {
        tokenFamilyId: session.tokenFamilyId,
        revokedAt: null
      },
      data: {
        revokedAt: now
      }
    });

    return null;
  }

  if (session.expiresAt <= now) {
    await prisma.refreshSession.updateMany({
      where: {
        id: session.id,
        revokedAt: null
      },
      data: {
        revokedAt: now
      }
    });

    return null;
  }

  const nextToken = createRawRefreshToken();
  const nextTokenHash = hashRefreshToken(nextToken);

  // The conditional update prevents the same refresh token from
  // successfully creating multiple replacement sessions.
  const rotationSucceeded = await prisma.$transaction(
    async (transaction) => {
      const revoked = await transaction.refreshSession.updateMany({
        where: {
          id: session.id,
          revokedAt: null,
          expiresAt: {
            gt: now
          }
        },
        data: {
          revokedAt: now,
          lastUsedAt: now
        }
      });

      if (revoked.count !== 1) {
        // A concurrent request may have used this token first.
        // Revoke the remaining sessions in this family.
        await transaction.refreshSession.updateMany({
          where: {
            tokenFamilyId: session.tokenFamilyId,
            revokedAt: null
          },
          data: {
            revokedAt: now
          }
        });

        return false;
      }

      await transaction.refreshSession.create({
        data: {
          userId: session.userId,
          tokenHash: nextTokenHash,
          tokenFamilyId: session.tokenFamilyId,
          expiresAt: new Date(
            Date.now() + REFRESH_TOKEN_LIFETIME_MS
          ),
          userAgent: metadata.userAgent?.slice(0, 500),
          ipAddress: metadata.ipAddress?.slice(0, 45)
        }
      });

      return true;
    }
  );

  if (!rotationSucceeded) {
    return null;
  }

  return {
    user: session.user,
    refreshToken: nextToken
  };
}

// Revoke the current session during logout.
export async function revokeRefreshToken(
  token: string
): Promise<void> {
  await prisma.refreshSession.updateMany({
    where: {
      tokenHash: hashRefreshToken(token),
      revokedAt: null
    },
    data: {
      revokedAt: new Date()
    }
  });
}
