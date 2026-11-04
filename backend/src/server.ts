
import { buildApp } from "./app.js";
import { env } from "./config/env.js";
import { prisma } from "./db/prisma.js";

async function startServer() {
  const app = await buildApp();

  try {
    await app.listen({
      port: env.PORT,
      host: "0.0.0.0"
    });

    app.log.info(`Server running on port ${env.PORT}`);
  } catch (error) {
    app.log.error({ err: error }, "Failed to start server");

    await prisma.$disconnect();
    process.exit(1);
  }

  // Close the server and database connections cleanly when stopping.
  const shutdown = async () => {
    app.log.info("Shutting down application");

    await app.close();
    await prisma.$disconnect();

    process.exit(0);
  };

  process.once("SIGINT", shutdown);
  process.once("SIGTERM", shutdown);
}

startServer();
