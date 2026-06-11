import { and, desc, eq } from "drizzle-orm";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import {
  createInvitationInputSchema,
  updateInvitationInputSchema,
  type Invitation,
  type InvitationListResponse,
  type InvitationResponse,
} from "@yours-truly/shared";
import { z } from "zod";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../auth/auth.js";
import { db, schema } from "../db/index.js";
import type { InvitationRow } from "../db/schema.js";

const uuidSchema = z.string().uuid();

/** Resolve the signed-in user's id from the Better Auth session cookie. */
async function sessionUserId(request: FastifyRequest): Promise<string | null> {
  const session = await auth.api.getSession({ headers: fromNodeHeaders(request.headers) });
  return session?.user.id ?? null;
}

/** Map a DB row to the client-safe invitation shape (never leaks the owner id). */
function toPublicInvitation(row: InvitationRow): Invitation {
  return {
    id: row.id,
    slug: row.slug,
    status: row.status,
    design: row.design,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

/**
 * True when an error — anywhere in its cause chain, since drizzle may wrap
 * driver errors — is a Postgres unique-constraint violation (SQLSTATE 23505).
 * The only unique constraint writable here is the slug.
 */
function isUniqueViolation(err: unknown): boolean {
  let e: unknown = err;
  while (e && typeof e === "object") {
    if ((e as { code?: unknown }).code === "23505") return true;
    e = (e as { cause?: unknown }).cause;
  }
  return false;
}

/**
 * Fetch an invitation by id if it exists and belongs to `userId`, else null.
 * A malformed id can't exist, and short-circuiting it also avoids a Postgres
 * uuid-cast error.
 */
async function findOwned(id: string, userId: string): Promise<InvitationRow | null> {
  if (!uuidSchema.safeParse(id).success) return null;
  const [row] = await db
    .select()
    .from(schema.invitations)
    .where(and(eq(schema.invitations.id, id), eq(schema.invitations.userId, userId)))
    .limit(1);
  return row ?? null;
}

function unauthenticated(reply: FastifyReply) {
  return reply
    .status(401)
    .send({ error: { code: "unauthenticated", message: "Not signed in" } });
}

function invalidInput(reply: FastifyReply, message: string) {
  return reply.status(400).send({ error: { code: "invalid_input", message } });
}

// Someone else's invitation 404s rather than 403s, so the endpoint doesn't
// reveal which ids exist.
function notFound(reply: FastifyReply) {
  return reply
    .status(404)
    .send({ error: { code: "not_found", message: "Invitation not found" } });
}

function slugTaken(reply: FastifyReply) {
  return reply
    .status(409)
    .send({ error: { code: "slug_taken", message: "That URL name is already taken" } });
}

export async function invitationRoutes(app: FastifyInstance) {
  // POST /api/invitations
  app.post("/", async (request, reply) => {
    const userId = await sessionUserId(request);
    if (!userId) return unauthenticated(reply);

    const parsed = createInvitationInputSchema.safeParse(request.body);
    if (!parsed.success) return invalidInput(reply, parsed.error.message);

    try {
      const [row] = await db
        .insert(schema.invitations)
        .values({
          userId,
          slug: parsed.data.slug,
          design: parsed.data.design ?? {},
        })
        .returning();
      const body: InvitationResponse = { invitation: toPublicInvitation(row) };
      return reply.status(201).send(body);
    } catch (err) {
      if (isUniqueViolation(err)) return slugTaken(reply);
      throw err;
    }
  });

  // GET /api/invitations — the signed-in user's invitations, latest first
  app.get("/", async (request, reply) => {
    const userId = await sessionUserId(request);
    if (!userId) return unauthenticated(reply);

    const rows = await db
      .select()
      .from(schema.invitations)
      .where(eq(schema.invitations.userId, userId))
      .orderBy(desc(schema.invitations.updatedAt));
    const body: InvitationListResponse = { invitations: rows.map(toPublicInvitation) };
    return reply.send(body);
  });

  // GET /api/invitations/by-slug/:slug — public: this is what guests (via the
  // web app's /invitations/<slug> page) read. Published only; drafts 404.
  app.get("/by-slug/:slug", async (request, reply) => {
    const { slug } = request.params as { slug: string };
    const [row] = await db
      .select()
      .from(schema.invitations)
      .where(
        and(eq(schema.invitations.slug, slug), eq(schema.invitations.status, "published")),
      )
      .limit(1);
    if (!row) return notFound(reply);
    const body: InvitationResponse = { invitation: toPublicInvitation(row) };
    return reply.send(body);
  });

  // GET /api/invitations/:id — owner only; drafts included
  app.get("/:id", async (request, reply) => {
    const userId = await sessionUserId(request);
    if (!userId) return unauthenticated(reply);

    const { id } = request.params as { id: string };
    const row = await findOwned(id, userId);
    if (!row) return notFound(reply);
    const body: InvitationResponse = { invitation: toPublicInvitation(row) };
    return reply.send(body);
  });

  // PATCH /api/invitations/:id
  app.patch("/:id", async (request, reply) => {
    const userId = await sessionUserId(request);
    if (!userId) return unauthenticated(reply);

    const parsed = updateInvitationInputSchema.safeParse(request.body);
    if (!parsed.success) return invalidInput(reply, parsed.error.message);

    const { id } = request.params as { id: string };
    const existing = await findOwned(id, userId);
    if (!existing) return notFound(reply);

    try {
      const [row] = await db
        .update(schema.invitations)
        .set(parsed.data)
        .where(eq(schema.invitations.id, existing.id))
        .returning();
      const body: InvitationResponse = { invitation: toPublicInvitation(row) };
      return reply.send(body);
    } catch (err) {
      if (isUniqueViolation(err)) return slugTaken(reply);
      throw err;
    }
  });

  // DELETE /api/invitations/:id
  app.delete("/:id", async (request, reply) => {
    const userId = await sessionUserId(request);
    if (!userId) return unauthenticated(reply);

    const { id } = request.params as { id: string };
    const existing = await findOwned(id, userId);
    if (!existing) return notFound(reply);

    await db.delete(schema.invitations).where(eq(schema.invitations.id, existing.id));
    return reply.status(204).send();
  });
}
