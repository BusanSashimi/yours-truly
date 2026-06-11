import { index, jsonb, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

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

// Values mirror INVITATION_STATUSES in @yours-truly/shared — kept inline here
// because drizzle-kit loads this file through a CJS resolver that can't import
// the ESM-only workspace package. Change both together.
export const invitationStatus = pgEnum("invitation_status", ["draft", "published"]);

/**
 * One wedding invitation page. `slug` is the user-chosen public URL segment
 * (/invitations/<slug>) — validated against `slugSchema` in @yours-truly/shared
 * before any write, so the unique constraint only ever sees canonical
 * (lowercase) values. `design` is the invitation's design document; its format
 * is owned by the shared zod contract (versioned JSON, schema TBD with the
 * editor) — the DB stores it opaquely.
 */
export const invitations = pgTable(
  "invitations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    slug: text("slug").notNull().unique(),
    status: invitationStatus("status").notNull().default("draft"),
    design: jsonb("design").$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  // Postgres does not index FK columns automatically; "list my invitations"
  // queries filter by owner.
  (table) => [index("invitations_user_id_idx").on(table.userId)],
);

export type InvitationRow = typeof invitations.$inferSelect;
export type NewInvitationRow = typeof invitations.$inferInsert;
