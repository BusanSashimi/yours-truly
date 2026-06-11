import { fileURLToPath } from "node:url";
import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import Fastify from "fastify";
import { corsOrigins, env } from "./env.js";
import { healthRoutes } from "./routes/health.js";
import { authRoutes } from "./routes/auth.js";
import { invitationRoutes } from "./routes/invitations.js";

export function buildServer() {
  const app = Fastify({
    logger: true,
  });

  app.register(cors, {
    origin: corsOrigins,
    credentials: true,
  });

  app.register(cookie, {
    secret: env.SESSION_SECRET,
  });

  // nginx proxies /api/* to this service; routes are registered under /api
  // so paths match in both dev (direct) and prod (behind nginx).
  app.register(healthRoutes, { prefix: "/api" });
  app.register(authRoutes, { prefix: "/api/auth" });
  app.register(invitationRoutes, { prefix: "/api/invitations" });

  return app;
}

async function main() {
  const app = buildServer();
  try {
    await app.listen({ port: env.PORT, host: env.HOST });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

// Only start listening when run as the entry point — importing this module
// (e.g. from tests, which use app.inject) must not open a socket.
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
