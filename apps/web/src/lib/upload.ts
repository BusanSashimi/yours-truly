import { createUpload } from "./api";
import { reencodeToJpeg } from "./image-processing";

/**
 * Re-encode an image client-side (bounds size, strips EXIF) and upload it to S3
 * via a presigned PUT; returns the stored asset key to save into the design
 * doc. Shared by the hero field and every editor panel that takes photos.
 */
export async function uploadInvitationImage(invitationId: string, file: File): Promise<string> {
  const blob = await reencodeToJpeg(file);
  const { uploadUrl, key } = await createUpload({
    invitationId,
    contentType: "image/jpeg",
    size: blob.size,
  });
  const put = await fetch(uploadUrl, {
    method: "PUT",
    body: blob,
    headers: { "Content-Type": "image/jpeg" },
  });
  if (!put.ok) throw new Error(`업로드에 실패했습니다 (${put.status})`);
  return key;
}
