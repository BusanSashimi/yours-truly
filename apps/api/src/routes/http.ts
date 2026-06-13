import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { and, eq } from "drizzle-orm";
import type { FastifyReply } from "fastify";
import { z } from "zod";
import { db, schema } from "../db/index.js";
import type { InvitationRow } from "../db/schema.js";

/** Shared helpers for the guest-facing feature routes (rsvp/guestbook/guest-uploads). */

export const uuidSchema = z.string().uuid();

export function unauthenticated(reply: FastifyReply) {
  return reply.status(401).send({ error: { code: "unauthenticated", message: "Not signed in" } });
}
export function invalidInput(reply: FastifyReply, message: string) {
  return reply.status(400).send({ error: { code: "invalid_input", message } });
}
export function notFound(reply: FastifyReply) {
  return reply.status(404).send({ error: { code: "not_found", message: "Not found" } });
}
export function forbidden(reply: FastifyReply, code = "forbidden", message = "Not allowed") {
  return reply.status(403).send({ error: { code, message } });
}

/**
 * A PUBLISHED invitation by id, or null — what guest-facing writes target.
 * Guests only ever see published pages; drafts accept no submissions. Malformed
 * ids short-circuit (also avoids a Postgres uuid-cast error).
 */
export async function findPublishedInvitation(id: string): Promise<InvitationRow | null> {
  if (!uuidSchema.safeParse(id).success) return null;
  const [row] = await db
    .select()
    .from(schema.invitations)
    .where(and(eq(schema.invitations.id, id), eq(schema.invitations.status, "published")))
    .limit(1);
  return row ?? null;
}

/** An invitation by id owned by `userId`, or null — owner reads/moderation. */
export async function findOwnedInvitation(
  id: string,
  userId: string,
): Promise<InvitationRow | null> {
  if (!uuidSchema.safeParse(id).success) return null;
  const [row] = await db
    .select()
    .from(schema.invitations)
    .where(and(eq(schema.invitations.id, id), eq(schema.invitations.userId, userId)))
    .limit(1);
  return row ?? null;
}

// 4-digit PIN hashing for guestbook self-delete. Low-stakes (the invitation
// owner can always moderate), but we still salt + scrypt rather than store the
// PIN, and compare in constant time.
export function hashPin(pin: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(pin, salt, 32);
  return `${salt.toString("hex")}:${hash.toString("hex")}`;
}
export function verifyPin(pin: string, stored: string | null): boolean {
  if (!stored) return false;
  const [saltHex, hashHex] = stored.split(":");
  if (!saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, "hex");
  const actual = scryptSync(pin, Buffer.from(saltHex, "hex"), expected.length);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
