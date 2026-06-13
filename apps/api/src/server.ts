import { fileURLToPath } from "node:url";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import Fastify from "fastify";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "./auth/auth.js";
import { corsOrigins, env } from "./env.js";
import { guestMessageRoutes } from "./routes/guest-messages.js";
import { guestUploadRoutes } from "./routes/guest-uploads.js";
import { guestbookRoutes } from "./routes/guestbook.js";
import { healthRoutes } from "./routes/health.js";
import { invitationRoutes } from "./routes/invitations.js";
import { rsvpRoutes } from "./routes/rsvp.js";
import { uploadRoutes } from "./routes/uploads.js";

export function buildServer() {
  const app = Fastify({
    logger: true,
  });

  app.register(cors, {
    origin: corsOrigins,
    credentials: true,
  });

  // Opt-in rate limiting: routes declare config.rateLimit themselves
  // (currently POST /api/uploads — presigns authorize public-bucket writes).
  app.register(rateLimit, { global: false });

  // Better Auth owns everything under /api/auth (email+password, Naver OAuth,
  // sessions). The catch-all converts Fastify's request into a web Request for
  // auth.handler and copies the Response back. set-cookie needs getSetCookie():
  // Headers.forEach folds multiple cookies into one comma-joined value, which
  // corrupts cookies containing Expires dates.
  app.route({
    method: ["GET", "POST"],
    url: "/api/auth/*",
    async handler(request, reply) {
      const url = new URL(request.url, `http://${request.headers.host}`);
      const webRequest = new Request(url, {
        method: request.method,
        headers: fromNodeHeaders(request.headers),
        ...(request.body ? { body: JSON.stringify(request.body) } : {}),
      });

      const response = await auth.handler(webRequest);

      reply.status(response.status);
      response.headers.forEach((value, key) => {
        if (key !== "set-cookie") reply.header(key, value);
      });
      const setCookies = response.headers.getSetCookie();
      if (setCookies.length > 0) reply.header("set-cookie", setCookies);
      return reply.send(response.body ? await response.text() : null);
    },
  });

  // nginx proxies /api/* to this service; routes are registered under /api
  // so paths match in both dev (direct) and prod (behind nginx).
  app.register(healthRoutes, { prefix: "/api" });
  app.register(invitationRoutes, { prefix: "/api/invitations" });
  // Per-invitation guest features (public write, owner read/moderate) — mounted
  // under the same prefix; their paths (/:id/rsvp etc.) don't collide with the
  // CRUD routes above.
  app.register(rsvpRoutes, { prefix: "/api/invitations" });
  app.register(guestbookRoutes, { prefix: "/api/invitations" });
  app.register(guestUploadRoutes, { prefix: "/api/invitations" });
  app.register(guestMessageRoutes, { prefix: "/api/invitations" });
  app.register(uploadRoutes, { prefix: "/api/uploads" });

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
