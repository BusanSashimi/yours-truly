import { and, desc, eq } from "drizzle-orm";
import type { FastifyInstance, FastifyReply } from "fastify";
import {
  confirmGuestUploadInputSchema,
  createGuestUploadInputSchema,
  invitationDesignFieldsSchema,
  type CreateGuestUploadResponse,
  type GuestUploadEntry,
  type GuestUploadListResponse,
} from "@yours-truly/shared";
import { sessionUserId } from "../auth/auth.js";
import { db, schema } from "../db/index.js";
import type { InvitationRow } from "../db/schema.js";
import { createGuestPresignedUpload, deleteAssetObject, isS3Configured } from "../s3.js";
import {
  findOwnedInvitation,
  findPublishedInvitation,
  forbidden,
  invalidInput,
  notFound,
  unauthenticated,
  uuidSchema,
} from "./http.js";

/** The guest-upload window is open when enabled and (no openDate or now ≥ it). */
function uploadWindow(invitation: InvitationRow): { enabled: boolean; open: boolean } {
  const parsed = invitationDesignFieldsSchema.safeParse(invitation.design);
  const gu = parsed.success ? parsed.data.guestUpload : undefined;
  const enabled = Boolean(gu?.enabled);
  const open = enabled && (!gu?.openDate || new Date(gu.openDate).getTime() <= Date.now());
  return { enabled, open };
}

function toPublic(row: typeof schema.guestUploads.$inferSelect): GuestUploadEntry {
  return {
    id: row.id,
    key: row.key,
    uploaderName: row.uploaderName,
    createdAt: row.createdAt.toISOString(),
  };
}

function gateClosed(reply: FastifyReply, enabled: boolean) {
  return enabled
    ? forbidden(reply, "guest_upload_not_open", "아직 사진 업로드 기간이 아닙니다")
    : forbidden(reply, "guest_upload_disabled", "사진 업로드가 사용 설정되지 않았습니다");
}

/**
 * Guest photo upload — 게스트스냅. Guests upload directly to S3 under the
 * `g/<invitationId>/` prefix while the window is open (gated by the design
 * doc's guestUpload settings). The owner can delete any upload. Routes mount
 * under /api/invitations.
 */
export async function guestUploadRoutes(app: FastifyInstance) {
  // POST /api/invitations/:id/guest-uploads — public presign (gated)
  app.post(
    "/:id/guest-uploads",
    { config: { rateLimit: { max: 30, timeWindow: "10 minutes" } } },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const invitation = await findPublishedInvitation(id);
      if (!invitation) return notFound(reply);

      const { enabled, open } = uploadWindow(invitation);
      if (!open) return gateClosed(reply, enabled);

      if (!isS3Configured()) {
        return reply.status(503).send({
          error: { code: "uploads_unavailable", message: "Image uploads are not configured" },
        });
      }

      const parsed = createGuestUploadInputSchema.safeParse(request.body);
      if (!parsed.success) return invalidInput(reply, parsed.error.message);

      const body: CreateGuestUploadResponse = await createGuestPresignedUpload(
        invitation.id,
        parsed.data.contentType,
        parsed.data.size,
      );
      return reply.send(body);
    },
  );

  // POST /api/invitations/:id/guest-uploads/confirm — record a completed upload
  app.post(
    "/:id/guest-uploads/confirm",
    { config: { rateLimit: { max: 30, timeWindow: "10 minutes" } } },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const invitation = await findPublishedInvitation(id);
      if (!invitation) return notFound(reply);

      const { enabled, open } = uploadWindow(invitation);
      if (!open) return gateClosed(reply, enabled);

      const parsed = confirmGuestUploadInputSchema.safeParse(request.body);
      if (!parsed.success) return invalidInput(reply, parsed.error.message);
      // The key must sit under THIS invitation's guest prefix.
      if (!parsed.data.key.startsWith(`g/${invitation.id}/`)) {
        return invalidInput(reply, "key does not belong to this invitation");
      }

      const [row] = await db
        .insert(schema.guestUploads)
        .values({
          invitationId: invitation.id,
          key: parsed.data.key,
          uploaderName: parsed.data.uploaderName ?? null,
        })
        .returning();
      return reply.status(201).send({ upload: toPublic(row) });
    },
  );

  // GET /api/invitations/:id/guest-uploads — public list, newest first
  app.get("/:id/guest-uploads", async (request, reply) => {
    const { id } = request.params as { id: string };
    const invitation = await findPublishedInvitation(id);
    if (!invitation) return notFound(reply);

    const rows = await db
      .select()
      .from(schema.guestUploads)
      .where(eq(schema.guestUploads.invitationId, invitation.id))
      .orderBy(desc(schema.guestUploads.createdAt));
    const body: GuestUploadListResponse = { uploads: rows.map(toPublic) };
    return reply.send(body);
  });

  // DELETE /api/invitations/:id/guest-uploads/:uploadId — owner moderation
  app.delete("/:id/guest-uploads/:uploadId", async (request, reply) => {
    const userId = await sessionUserId(request);
    if (!userId) return unauthenticated(reply);
    const { id, uploadId } = request.params as { id: string; uploadId: string };
    const invitation = await findOwnedInvitation(id, userId);
    if (!invitation) return notFound(reply);
    if (!uuidSchema.safeParse(uploadId).success) return reply.status(204).send();

    const [row] = await db
      .select()
      .from(schema.guestUploads)
      .where(
        and(
          eq(schema.guestUploads.id, uploadId),
          eq(schema.guestUploads.invitationId, invitation.id),
        ),
      )
      .limit(1);
    if (row) {
      await db.delete(schema.guestUploads).where(eq(schema.guestUploads.id, row.id));
      if (isS3Configured()) {
        deleteAssetObject(row.key).catch((err) =>
          request.log.error({ err, key: row.key }, "guest upload asset cleanup failed"),
        );
      }
    }
    return reply.status(204).send();
  });
}
