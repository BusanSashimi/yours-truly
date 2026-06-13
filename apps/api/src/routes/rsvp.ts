import { and, desc, eq } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import { createRsvpInputSchema, type RsvpEntry, type RsvpListResponse } from "@yours-truly/shared";
import { sessionUserId } from "../auth/auth.js";
import { db, schema } from "../db/index.js";
import {
  findOwnedInvitation,
  findPublishedInvitation,
  invalidInput,
  notFound,
  unauthenticated,
  uuidSchema,
} from "./http.js";

/**
 * RSVP — 참석 여부 전달. Guests POST without an account (bounded by the shared
 * input schema + a per-IP rate limit); only the invitation owner can read the
 * responses or delete one. Routes mount under /api/invitations.
 */
export async function rsvpRoutes(app: FastifyInstance) {
  // POST /api/invitations/:id/rsvp — public submission
  app.post(
    "/:id/rsvp",
    { config: { rateLimit: { max: 8, timeWindow: "10 minutes" } } },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const invitation = await findPublishedInvitation(id);
      if (!invitation) return notFound(reply);

      const parsed = createRsvpInputSchema.safeParse(request.body);
      if (!parsed.success) return invalidInput(reply, parsed.error.message);
      const d = parsed.data;

      await db.insert(schema.rsvpResponses).values({
        invitationId: invitation.id,
        name: d.name,
        attendance: d.attendance,
        side: d.side ?? null,
        headcount: d.headcount ?? null,
        meal: d.meal ?? null,
        phone: d.phone ?? null,
        message: d.message ?? null,
      });
      return reply.status(201).send({ ok: true });
    },
  );

  // GET /api/invitations/:id/rsvp — owner only
  app.get("/:id/rsvp", async (request, reply) => {
    const userId = await sessionUserId(request);
    if (!userId) return unauthenticated(reply);
    const { id } = request.params as { id: string };
    const invitation = await findOwnedInvitation(id, userId);
    if (!invitation) return notFound(reply);

    const rows = await db
      .select()
      .from(schema.rsvpResponses)
      .where(eq(schema.rsvpResponses.invitationId, invitation.id))
      .orderBy(desc(schema.rsvpResponses.createdAt));

    const responses: RsvpEntry[] = rows.map((r) => ({
      id: r.id,
      name: r.name,
      attendance: r.attendance,
      side: r.side,
      headcount: r.headcount,
      meal: r.meal as RsvpEntry["meal"],
      phone: r.phone,
      message: r.message,
      createdAt: r.createdAt.toISOString(),
    }));
    const counts = {
      attending: responses.filter((r) => r.attendance === "yes").length,
      declined: responses.filter((r) => r.attendance === "no").length,
      guests: responses
        .filter((r) => r.attendance === "yes")
        .reduce((n, r) => n + (r.headcount ?? 1), 0),
    };
    const body: RsvpListResponse = { responses, counts };
    return reply.send(body);
  });

  // DELETE /api/invitations/:id/rsvp/:rsvpId — owner moderation
  app.delete("/:id/rsvp/:rsvpId", async (request, reply) => {
    const userId = await sessionUserId(request);
    if (!userId) return unauthenticated(reply);
    const { id, rsvpId } = request.params as { id: string; rsvpId: string };
    const invitation = await findOwnedInvitation(id, userId);
    if (!invitation) return notFound(reply);
    if (!uuidSchema.safeParse(rsvpId).success) return reply.status(204).send();

    await db
      .delete(schema.rsvpResponses)
      .where(
        and(
          eq(schema.rsvpResponses.id, rsvpId),
          eq(schema.rsvpResponses.invitationId, invitation.id),
        ),
      );
    return reply.status(204).send();
  });
}
