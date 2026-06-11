import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../db/index.js";
import * as schema from "../db/schema.js";
import { corsOrigins, env } from "../env.js";

/**
 * Better Auth instance — the single authority for accounts and sessions.
 * Mounted under /api/auth (see server.ts); key endpoints:
 *   POST /api/auth/sign-up/email · POST /api/auth/sign-in/email
 *   POST /api/auth/sign-out      · GET  /api/auth/get-session
 *   GET  /api/auth/callback/naver (OAuth callback — register this URL in the
 *   Naver developers console: <BETTER_AUTH_URL>/api/auth/callback/naver)
 *
 * Naver sign-in is only offered when NAVER_CLIENT_ID/SECRET are configured,
 * so dev and CI work without OAuth credentials.
 */
export const auth = betterAuth({
  baseURL: env.BETTER_AUTH_URL ?? `http://localhost:${env.PORT}`,
  basePath: "/api/auth",
  secret: env.BETTER_AUTH_SECRET,
  trustedOrigins: corsOrigins,
  database: drizzleAdapter(db, { provider: "pg", usePlural: true, schema }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },
  socialProviders:
    env.NAVER_CLIENT_ID && env.NAVER_CLIENT_SECRET
      ? {
          naver: {
            clientId: env.NAVER_CLIENT_ID,
            clientSecret: env.NAVER_CLIENT_SECRET,
          },
        }
      : {},
  advanced: {
    database: {
      // Schema defines uuid PKs with defaults — let Postgres generate ids.
      generateId: false,
    },
  },
});
