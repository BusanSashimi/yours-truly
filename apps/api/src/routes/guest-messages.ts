import { and, desc, eq } from "drizzle-orm";
import type { FastifyInstance, FastifyReply } from "fastify";
import {
  createGuestMessageInputSchema,
  createGuestMessagePresignInputSchema,
  invitationDesignFieldsSchema,
  type CreateGuestMessagePresignResponse,
  type GuestMessage,
  type GuestMessageListResponse,
} from "@yours-truly/shared";
import { sessionUserId } from "../auth/auth.js";
import { db, schema } from "../db/index.js";
import type { InvitationRow } from "../db/schema.js";
import {
  createMessagePresignedUpload,
  createPresignedGetUrl,
  deleteAssetObjects,
  isS3Configured,
} from "../s3.js";
import {
  findOwnedInvitation,
  findPublishedInvitation,
  forbidden,
  invalidInput,
  notFound,
  unauthenticated,
  uuidSchema,
} from "./http.js";

/** The guest-message window is open when enabled and (no openDate or now ≥ it). */
function messageWindow(invitation: InvitationRow): { enabled: boolean; open: boolean } {
  const parsed = invitationDesignFieldsSchema.safeParse(invitation.design);
  const gm = parsed.success ? parsed.data.guestMessages : undefined;
  const enabled = Boolean(gm?.enabled);
  const open = enabled && (!gm?.openDate || new Date(gm.openDate).getTime() <= Date.now());
  return { enabled, open };
}

function gateClosed(reply: FastifyReply, enabled: boolean) {
  return enabled
    ? forbidden(reply, "guest_message_not_open", "아직 메시지를 받지 않습니다")
    : forbidden(reply, "guest_message_disabled", "메시지 받기가 사용 설정되지 않았습니다");
}

/**
 * Private guest messages (QR 메시지·사진). A guest reaches the couple's QR submit
 * page and leaves one message and/or photos; it lands ONLY in the couple's
 * dashboard inbox (never shown publicly). Photos go to the non-public
 * `m/<invitationId>/` S3 prefix and are surfaced to the owner via short-lived
 * presigned GET. Public write (gated by the design doc's guestMessages
 * settings), owner-only read/moderate. Routes mount under /api/invitations.
 */
export async function guestMessageRoutes(app: FastifyInstance) {
  // POST /api/invitations/:id/messages/presign — public presign (gated)
  app.post(
    "/:id/messages/presign",
    { config: { rateLimit: { max: 30, timeWindow: "10 minutes" } } },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const invitation = await findPublishedInvitation(id);
      if (!invitation) return notFound(reply);

      const { enabled, open } = messageWindow(invitation);
      if (!open) return gateClosed(reply, enabled);

      if (!isS3Configured()) {
        return reply.status(503).send({
          error: { code: "uploads_unavailable", message: "Image uploads are not configured" },
        });
      }

      const parsed = createGuestMessagePresignInputSchema.safeParse(request.body);
      if (!parsed.success) return invalidInput(reply, parsed.error.message);

      const body: CreateGuestMessagePresignResponse = await createMessagePresignedUpload(
        invitation.id,
        parsed.data.contentType,
        parsed.data.size,
      );
      return reply.send(body);
    },
  );

  // POST /api/invitations/:id/messages — public; one message + 0–N photos
  app.post(
    "/:id/messages",
    { config: { rateLimit: { max: 10, timeWindow: "10 minutes" } } },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const invitation = await findPublishedInvitation(id);
      if (!invitation) return notFound(reply);

      const { enabled, open } = messageWindow(invitation);
      if (!open) return gateClosed(reply, enabled);

      const parsed = createGuestMessageInputSchema.safeParse(request.body);
      if (!parsed.success) return invalidInput(reply, parsed.error.message);
      // Every photo key must sit under THIS invitation's private prefix.
      const prefix = `m/${invitation.id}/`;
      if (!parsed.data.photoKeys.every((k) => k.startsWith(prefix))) {
        return invalidInput(reply, "key does not belong to this invitation");
      }

      const [row] = await db
        .insert(schema.guestMessages)
        .values({
          invitationId: invitation.id,
          senderName: parsed.data.senderName ?? null,
          message: parsed.data.message ?? null,
          photoKeys: parsed.data.photoKeys,
        })
        .returning();
      return reply
        .status(201)
        .send({ message: { id: row.id, createdAt: row.createdAt.toISOString() } });
    },
  );

  // GET /api/invitations/:id/messages — owner inbox, newest first
  app.get("/:id/messages", async (request, reply) => {
    const userId = await sessionUserId(request);
    if (!userId) return unauthenticated(reply);
    const { id } = request.params as { id: string };
    const invitation = await findOwnedInvitation(id, userId);
    if (!invitation) return notFound(reply);

    const rows = await db
      .select()
      .from(schema.guestMessages)
      .where(eq(schema.guestMessages.invitationId, invitation.id))
      .orderBy(desc(schema.guestMessages.createdAt));

    // Private photos are served via short-lived presigned GET, never the public
    // bucket policy.
    const messages: GuestMessage[] = await Promise.all(
      rows.map(async (row) => ({
        id: row.id,
        senderName: row.senderName,
        message: row.message,
        photos: await Promise.all(
          row.photoKeys.map(async (key) => ({ key, url: await createPresignedGetUrl(key) })),
        ),
        readAt: row.readAt ? row.readAt.toISOString() : null,
        createdAt: row.createdAt.toISOString(),
      })),
    );
    const unread = rows.reduce((n, row) => n + (row.readAt ? 0 : 1), 0);
    const body: GuestMessageListResponse = { messages, total: rows.length, unread };
    return reply.send(body);
  });

  // PATCH /api/invitations/:id/messages/:msgId/read — owner marks a message read
  app.patch("/:id/messages/:msgId/read", async (request, reply) => {
    const userId = await sessionUserId(request);
    if (!userId) return unauthenticated(reply);
    const { id, msgId } = request.params as { id: string; msgId: string };
    const invitation = await findOwnedInvitation(id, userId);
    if (!invitation) return notFound(reply);
    if (!uuidSchema.safeParse(msgId).success) return notFound(reply);

    await db
      .update(schema.guestMessages)
      .set({ readAt: new Date() })
      .where(
        and(
          eq(schema.guestMessages.id, msgId),
          eq(schema.guestMessages.invitationId, invitation.id),
        ),
      );
    return reply.status(204).send();
  });

  // DELETE /api/invitations/:id/messages/:msgId — owner moderation
  app.delete("/:id/messages/:msgId", async (request, reply) => {
    const userId = await sessionUserId(request);
    if (!userId) return unauthenticated(reply);
    const { id, msgId } = request.params as { id: string; msgId: string };
    const invitation = await findOwnedInvitation(id, userId);
    if (!invitation) return notFound(reply);
    if (!uuidSchema.safeParse(msgId).success) return reply.status(204).send();

    const [row] = await db
      .select()
      .from(schema.guestMessages)
      .where(
        and(
          eq(schema.guestMessages.id, msgId),
          eq(schema.guestMessages.invitationId, invitation.id),
        ),
      )
      .limit(1);
    if (row) {
      await db.delete(schema.guestMessages).where(eq(schema.guestMessages.id, row.id));
      if (isS3Configured() && row.photoKeys.length > 0) {
        deleteAssetObjects(row.photoKeys).catch((err) =>
          request.log.error({ err, keys: row.photoKeys }, "guest message asset cleanup failed"),
        );
      }
    }
    return reply.status(204).send();
  });
}
