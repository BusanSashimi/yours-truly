import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

/**
 * Users table. `passwordHash` is stored server-side only and is never
 * serialized to clients (see `userSchema` in @yours-truly/shared).
 *
 * When Better Auth is wired up (roadmap step 4), it will own the `sessions`
 * and account/verification tables; this `users` table is the anchor.
 */
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const sessions = pgTable("sessions", {
  // Opaque, app-generated session token (32 random bytes, hex) — set as a
  // signed httpOnly cookie. Not a uuid so it reads unambiguously as a secret.
  id: text("id").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type UserRow = typeof users.$inferSelect;
export type NewUserRow = typeof users.$inferInsert;
