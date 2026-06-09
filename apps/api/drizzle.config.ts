import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    // drizzle-kit reads env directly; keep DATABASE_URL set when running migrations.
    url: process.env.DATABASE_URL!,
  },
});
