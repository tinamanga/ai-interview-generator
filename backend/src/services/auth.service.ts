import argon2 from "argon2";
import { Prisma } from "@prisma/client";

import { prisma } from "../db/prisma.js";
import type { LoginInput, RegisterInput } from "../schemas/auth.schema.js";

// Public user data must never include password hashes.
export type PublicUser = {
  id: string;
  email: string;
  createdAt: Date;
};

export class EmailAlreadyRegisteredError extends Error {
  constructor() {
    super("An account with this email address already exists.");
    this.name = "EmailAlreadyRegisteredError";
  }
}

// Create an account after securely hashing its password.
export async function registerUser(
  input: RegisterInput
): Promise<PublicUser> {
  const passwordHash = await argon2.hash(input.password, {
    type: argon2.argon2id
  });

  try {
    const user = await prisma.user.create({
      data: {
        email: input.email,
        passwordHash
      },
      select: {
        id: true,
        email: true,
        createdAt: true
      }
    });

    return user;
  } catch (error) {
    // Translate the unique-email database constraint into a safe,
    // predictable application error.
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new EmailAlreadyRegisteredError();
    }

    throw error;
  }
}

// Return null for either an unknown email or an incorrect password.
// This prevents the login endpoint from revealing which accounts exist.
export async function authenticateUser(
  input: LoginInput
): Promise<PublicUser | null> {
  const user = await prisma.user.findUnique({
    where: {
      email: input.email
    },
    select: {
      id: true,
      email: true,
      passwordHash: true,
      createdAt: true
    }
  });

  if (!user) {
    return null;
  }

  const passwordMatches = await argon2.verify(
    user.passwordHash,
    input.password
  );

  if (!passwordMatches) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    createdAt: user.createdAt
  };
}
