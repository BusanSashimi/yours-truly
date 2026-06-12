import { randomUUID } from "node:crypto";
import {
  DeleteObjectsCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "./env.js";

/**
 * S3 asset storage for invitation images. Optional: when S3_BUCKET is unset
 * (e.g. CI), uploads are disabled and the editor hides the upload UI.
 * Credentials come from the SDK default chain (instance role in prod,
 * ~/.aws locally).
 *
 * Objects live under `i/<invitationId>/<uuid>.<ext>` — publicly readable via
 * the bucket policy (GetObject on i/* only, no ListBucket: keys stay
 * unguessable). The renderer only ever displays keys under its own
 * invitation's prefix, so this key shape is load-bearing.
 */
export function isS3Configured(): boolean {
  return Boolean(env.S3_BUCKET);
}

/** Public origin the bucket serves from (virtual-hosted style). */
export function assetPublicBase(): string {
  return `https://${env.S3_BUCKET}.s3.${env.S3_REGION}.amazonaws.com`;
}

const EXT_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

// requestChecksumCalculation: since SDK 3.729.0 the default (WHEN_SUPPORTED)
// poisons presigned PUT URLs with an empty-body CRC32 the real upload can
// never match (signed x-amz-checksum-crc32=AAAAAA==). Verified still true on
// 3.1067.0 — WHEN_REQUIRED keeps checksums out of presigned URLs.
let client: S3Client | undefined;
function s3(): S3Client {
  client ??= new S3Client({
    region: env.S3_REGION,
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
  });
  return client;
}

/**
 * Presign a direct-to-S3 PUT. ContentType AND ContentLength are bound into
 * the signature (signableHeaders forces content-type in; content-length is
 * signed automatically when set) — the browser must send exactly this type,
 * and the body must be exactly `size` bytes, or S3 rejects the request. Size
 * is therefore enforced cryptographically, not advisorily.
 */
export async function createPresignedUpload(
  invitationId: string,
  contentType: string,
  size: number,
): Promise<{ uploadUrl: string; publicUrl: string; key: string }> {
  const key = `i/${invitationId}/${randomUUID()}.${EXT_BY_TYPE[contentType]}`;
  const command = new PutObjectCommand({
    Bucket: env.S3_BUCKET,
    Key: key,
    ContentType: contentType,
    ContentLength: size,
  });
  const uploadUrl = await getSignedUrl(s3(), command, {
    expiresIn: 120,
    signableHeaders: new Set(["content-type"]),
  });
  return { uploadUrl, publicUrl: `${assetPublicBase()}/${key}`, key };
}

/**
 * Best-effort removal of every object under an invitation's prefix — called
 * when the invitation is deleted, so photos of deleted invitations don't stay
 * publicly fetchable. Errors are the caller's to log; deletion of the DB row
 * must not be blocked by S3 hiccups.
 */
export async function deleteAssetPrefix(invitationId: string): Promise<void> {
  if (!isS3Configured()) return;
  const prefix = `i/${invitationId}/`;
  let continuationToken: string | undefined;
  do {
    const page = await s3().send(
      new ListObjectsV2Command({
        Bucket: env.S3_BUCKET,
        Prefix: prefix,
        ContinuationToken: continuationToken,
      }),
    );
    const keys = (page.Contents ?? []).map((o) => ({ Key: o.Key! }));
    if (keys.length > 0) {
      await s3().send(
        new DeleteObjectsCommand({
          Bucket: env.S3_BUCKET,
          Delete: { Objects: keys, Quiet: true },
        }),
      );
    }
    continuationToken = page.IsTruncated ? page.NextContinuationToken : undefined;
  } while (continuationToken);
}
