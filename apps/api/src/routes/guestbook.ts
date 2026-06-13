import { and, count, desc, eq } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import {
  createGuestbookInputSchema,
  deleteGuestbookInputSchema,
  type GuestbookEntry,
  type GuestbookListResponse,
} from "@yours-truly/shared";
import { sessionUserId } from "../auth/auth.js";
import { db, schema } from "../db/index.js";
import {
  findOwnedInvitation,
  findPublishedInvitation,
  forbidden,
  hashPin,
  invalidInput,
  notFound,
  uuidSchema,
  verifyPin,
} from "./http.js";

const listQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

function toPublic(row: typeof schema.guestbookEntries.$inferSelect): GuestbookEntry {
  return {
    id: row.id,
    name: row.name,
    message: row.message,
    createdAt: row.createdAt.toISOString(),
  };
}

/**
 * Guestbook — 방명록. Public read + write; the PIN/hash is never serialized. An
 * entry can be deleted by the invitation owner (moderation) or by its author
 * with the 4-digit PIN they set. Routes mount under /api/invitations.
 */
export async function guestbookRoutes(app: FastifyInstance) {
  // POST /api/invitations/:id/guestbook — public
  app.post(
    "/:id/guestbook",
    { config: { rateLimit: { max: 12, timeWindow: "10 minutes" } } },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const invitation = await findPublishedInvitation(id);
      if (!invitation) return notFound(reply);

      const parsed = createGuestbookInputSchema.safeParse(request.body);
      if (!parsed.success) return invalidInput(reply, parsed.error.message);
      const { name, message, pin } = parsed.data;

      const [row] = await db
        .insert(schema.guestbookEntries)
        .values({
          invitationId: invitation.id,
          name,
          message,
          pinHash: pin ? hashPin(pin) : null,
        })
        .returning();
      return reply.status(201).send({ entry: toPublic(row) });
    },
  );

  // GET /api/invitations/:id/guestbook — public, paginated, newest first
  app.get("/:id/guestbook", async (request, reply) => {
    const { id } = request.params as { id: string };
    const invitation = await findPublishedInvitation(id);
    if (!invitation) return notFound(reply);

    const q = listQuerySchema.safeParse(request.query);
    if (!q.success) return invalidInput(reply, q.error.message);
    const { limit, offset } = q.data;

    const rows = await db
      .select()
      .from(schema.guestbookEntries)
      .where(eq(schema.guestbookEntries.invitationId, invitation.id))
      .orderBy(desc(schema.guestbookEntries.createdAt))
      .limit(limit)
      .offset(offset);
    const [{ total }] = await db
      .select({ total: count() })
      .from(schema.guestbookEntries)
      .where(eq(schema.guestbookEntries.invitationId, invitation.id));

    const body: GuestbookListResponse = { entries: rows.map(toPublic), total };
    return reply.send(body);
  });

  // DELETE /api/invitations/:id/guestbook/:entryId — owner (moderation) or
  // author with the PIN they set.
  app.delete("/:id/guestbook/:entryId", async (request, reply) => {
    const { id, entryId } = request.params as { id: string; entryId: string };
    if (!uuidSchema.safeParse(entryId).success) return notFound(reply);

    const [entry] = await db
      .select()
      .from(schema.guestbookEntries)
      .where(
        and(
          eq(schema.guestbookEntries.id, entryId),
          eq(schema.guestbookEntries.invitationId, id),
        ),
      )
      .limit(1);
    if (!entry) return notFound(reply);

    const userId = await sessionUserId(request);
    const isOwner = userId ? Boolean(await findOwnedInvitation(id, userId)) : false;

    if (!isOwner) {
      const parsed = deleteGuestbookInputSchema.safeParse(request.body);
      if (!parsed.success || !verifyPin(parsed.data.pin, entry.pinHash)) {
        return forbidden(reply, "pin_mismatch", "PIN이 일치하지 않습니다");
      }
    }

    await db.delete(schema.guestbookEntries).where(eq(schema.guestbookEntries.id, entry.id));
    return reply.status(204).send();
  });
}
