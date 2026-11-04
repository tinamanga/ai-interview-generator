
import { PrismaClient } from "@prisma/client";
import { env } from "../config/env.js";

// Reuse the Prisma client during development.
// This prevents creating multiple database connection pools
// whenever the development server reloads.
const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient();

// Save the client globally outside production to support hot reload.
if (env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
