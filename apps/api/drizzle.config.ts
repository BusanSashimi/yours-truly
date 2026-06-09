import { readFileSync } from "node:fs";
import { defineConfig } from "drizzle-kit";

// drizzle-kit ignores dbCredentials.ssl when given a `url`, so feed discrete
// fields instead — that way the app's TLS posture is mirrored for migrations:
// verify-full against DATABASE_CA when set (RDS), no SSL locally.
const url = new URL(process.env.DATABASE_URL!);
const caPath = process.env.DATABASE_CA;

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    host: url.hostname,
    port: url.port ? Number(url.port) : 5432,
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.slice(1),
    ssl: caPath ? { ca: readFileSync(caPath, "utf8"), rejectUnauthorized: true } : false,
  },
});
