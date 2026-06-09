import { z } from "zod";

/** Validate process env once at boot so misconfig fails fast and loud. */
const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  PORT: z.coerce.number().default(4000),
  CORS_ORIGIN: z.string().default("http://localhost:3000"),
  SESSION_SECRET: z.string().min(16),
  // Path to a CA bundle (e.g. the RDS CA). When set, the DB connection uses TLS
  // with full chain + hostname verification. Unset for local dev (no SSL).
  DATABASE_CA: z.string().optional(),
});

export const env = envSchema.parse(process.env);

export const corsOrigins = env.CORS_ORIGIN.split(",").map((s) => s.trim());
