import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "../env.js";
import * as schema from "./schema.js";

/** Single shared postgres connection pool for the process. */
const client = postgres(env.DATABASE_URL);

export const db = drizzle(client, { schema });
export { schema };
