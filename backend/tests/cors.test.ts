import {
  afterEach,
  describe,
  expect,
  it,
  vi
} from "vitest";

import type { FastifyInstance } from "fastify";

// Keep this test independent of local secrets and database connections.
vi.mock("../src/config/env.js", () => ({
  env: {
    NODE_ENV: "test",
    FRONTEND_URL: "http://localhost:3000",
    ACCESS_TOKEN_SECRET: "test-only-secret-with-at-least-32-characters"
  }
}));

// Route behavior is not relevant to this CORS configuration test.
vi.mock("../src/routes/health.routes.js", () => ({
  default: async () => {}
}));

vi.mock("../src/routes/auth.routes.js", () => ({
  default: async () => {}
}));

vi.mock("../src/routes/interview.routes.js", () => ({
  default: async () => {}
}));

import { buildApp } from "../src/app.js";

describe("Application CORS configuration", () => {
  let app: FastifyInstance | undefined;

  afterEach(async () => {
    if (app) {
      await app.close();
      app = undefined;
    }
  });

  it("allows DELETE requests from the configured frontend origin", async () => {
    app = await buildApp();

    const response = await app.inject({
      method: "OPTIONS",
      url: "/api/v1/interviews/test-id/bookmark",
      headers: {
        origin: "http://localhost:3000",
        "access-control-request-method": "DELETE",
        "access-control-request-headers": "authorization,content-type"
      }
    });

    expect(response.statusCode).toBe(204);
    expect(response.headers["access-control-allow-origin"]).toBe(
      "http://localhost:3000"
    );
    expect(response.headers["access-control-allow-credentials"]).toBe("true");

    const allowedMethods =
      response.headers["access-control-allow-methods"] ?? "";

    expect(allowedMethods).toContain("DELETE");
  });
});
