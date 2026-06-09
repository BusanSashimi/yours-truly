import type { FastifyInstance } from "fastify";
import type { Health } from "@yours-truly/shared";

export async function healthRoutes(app: FastifyInstance) {
  app.get("/health", async (): Promise<Health> => {
    return { status: "ok", uptime: process.uptime() };
  });
}
