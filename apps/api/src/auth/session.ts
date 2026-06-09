import { randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import type { FastifyReply, FastifyRequest } from "fastify";
import type { User } from "@yours-truly/shared";
import { db, schema } from "../db/index.js";
import type { UserRow } from "../db/schema.js";

export const SESSION_COOKIE = "sid";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

/** Map a DB row to the public, client-safe user shape (never leaks the hash). */
export function toPublicUser(row: UserRow): User {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    createdAt: row.createdAt.toISOString(),
  };
}

/** Create a session row and return its opaque token + expiry. */
export async function createSession(userId: string) {
  const id = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await db.insert(schema.sessions).values({ id, userId, expiresAt });
  return { id, expiresAt };
}

/** Set the signed, httpOnly session cookie. */
export function setSessionCookie(reply: FastifyReply, id: string, expiresAt: Date) {
  reply.setCookie(SESSION_COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
    signed: true,
  });
}

/** Clear the session cookie. */
export function clearSessionCookie(reply: FastifyReply) {
  reply.clearCookie(SESSION_COOKIE, { path: "/" });
}

/**
 * Resolve the current user from the request's session cookie, or null.
 * Expired sessions are deleted lazily on access.
 */
export async function getSessionUser(request: FastifyRequest): Promise<User | null> {
  const raw = request.cookies[SESSION_COOKIE];
  if (!raw) return null;

  const unsigned = request.unsignCookie(raw);
  if (!unsigned.valid || !unsigned.value) return null;
  const id = unsigned.value;

  const [session] = await db
    .select()
    .from(schema.sessions)
    .where(eq(schema.sessions.id, id))
    .limit(1);
  if (!session) return null;

  if (session.expiresAt.getTime() < Date.now()) {
    await db.delete(schema.sessions).where(eq(schema.sessions.id, id));
    return null;
  }

  const [user] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.id, session.userId))
    .limit(1);
  return user ? toPublicUser(user) : null;
}

/** Delete the session identified by the request cookie (logout). */
export async function destroySession(request: FastifyRequest): Promise<void> {
  const raw = request.cookies[SESSION_COOKIE];
  if (!raw) return;
  const unsigned = request.unsignCookie(raw);
  if (!unsigned.valid || !unsigned.value) return;
  await db.delete(schema.sessions).where(eq(schema.sessions.id, unsigned.value));
}
