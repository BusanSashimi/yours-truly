import { and, eq } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import { createUploadInputSchema, type CreateUploadResponse } from "@yours-truly/shared";
import { sessionUserId } from "../auth/auth.js";
import { db, schema } from "../db/index.js";
import { createPresignedUpload, isS3Configured } from "../s3.js";

/**
 * Image uploads: the client asks for a presigned PUT, uploads directly to S3
 * (no API bandwidth), then saves the returned key into the invitation design
 * via the normal PATCH flow. Rate-limited — presigns are cheap to mint but
 * each one authorizes a write to the public bucket.
 */
export async function uploadRoutes(app: FastifyInstance) {
  // POST /api/uploads
  app.post(
    "/",
    {
      config: {
        rateLimit: {
          max: 30,
          timeWindow: "10 minutes",
        },
      },
    },
    async (request, reply) => {
      const userId = await sessionUserId(request);
      if (!userId) {
        return reply
          .status(401)
          .send({ error: { code: "unauthenticated", message: "Not signed in" } });
      }

      if (!isS3Configured()) {
        return reply.status(503).send({
          error: { code: "uploads_unavailable", message: "Image uploads are not configured" },
        });
      }

      const parsed = createUploadInputSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply
          .status(400)
          .send({ error: { code: "invalid_input", message: parsed.error.message } });
      }
      const { invitationId, contentType, size } = parsed.data;

      // Uploads are keyed under the invitation's prefix — only its owner may
      // mint one (404 like the invitation routes: don't confirm foreign ids).
      const [owned] = await db
        .select({ id: schema.invitations.id })
        .from(schema.invitations)
        .where(
          and(eq(schema.invitations.id, invitationId), eq(schema.invitations.userId, userId)),
        )
        .limit(1);
      if (!owned) {
        return reply
          .status(404)
          .send({ error: { code: "not_found", message: "Invitation not found" } });
      }

      const body: CreateUploadResponse = await createPresignedUpload(
        invitationId,
        contentType,
        size,
      );
      return reply.send(body);
    },
  );
}
