import { readFileSync } from "node:fs";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "../env.js";
import * as schema from "./schema.js";

// With DATABASE_CA set (production/RDS), verify the server cert against that CA
// and its hostname (verify-full). Without it (local dev), connect without TLS.
const ssl = env.DATABASE_CA
  ? { ca: readFileSync(env.DATABASE_CA, "utf8"), rejectUnauthorized: true }
  : undefined;

/** Single shared postgres connection pool for the process. */
const client = postgres(env.DATABASE_URL, ssl ? { ssl } : {});

export const db = drizzle(client, { schema });
export { schema };

/** Close the connection pool — used by tests so the process can exit cleanly. */
export const closeDb = () => client.end({ timeout: 5 });
