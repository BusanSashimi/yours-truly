import { z } from "zod";

/** Validate process env once at boot so misconfig fails fast and loud. */
const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  // Bind address. Localhost by default: only nginx on the same host should
  // reach the API directly. Set HOST=0.0.0.0 only if off-box clients must
  // connect without a proxy.
  HOST: z.string().default("127.0.0.1"),
  PORT: z.coerce.number().default(4000),
  CORS_ORIGIN: z.string().default("http://localhost:3000"),
  // Better Auth: cookie/token signing secret, and the public origin used to
  // build OAuth callback URLs (set to https://www.yourstruly.it in prod;
  // defaults to the local API origin when unset).
  BETTER_AUTH_SECRET: z.string().min(16),
  BETTER_AUTH_URL: z.string().url().optional(),
  // Naver OAuth (https://developers.naver.com). Optional: when unset, only
  // email/password auth is enabled (dev and CI need no OAuth credentials).
  NAVER_CLIENT_ID: z.string().optional(),
  NAVER_CLIENT_SECRET: z.string().optional(),
  // Path to a CA bundle (e.g. the RDS CA). When set, the DB connection uses TLS
  // with full chain + hostname verification. Unset for local dev (no SSL).
  DATABASE_CA: z.string().optional(),
});

export const env = envSchema.parse(process.env);

export const corsOrigins = env.CORS_ORIGIN.split(",").map((s) => s.trim());
