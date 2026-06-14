/**
 * Thrown when client-side image re-encoding fails. `code` lets guest-facing
 * callers show a translated message; `message` stays human-readable for the
 * (Korean-only) dashboard, which surfaces `e.message` directly.
 */
export class ImageError extends Error {
  constructor(
    readonly code: "decode" | "process" | "encode",
    message: string,
  ) {
    super(message);
    this.name = "ImageError";
  }
}

/**
 * Client-side re-encode before upload. One pass buys three properties:
 * - bounded dimensions/bytes (KakaoTalk og:image scraping caps out at 5MB,
 *   and camera originals routinely exceed it),
 * - EXIF stripped — originals carry GPS/device/timestamps and the bucket is
 *   public; canvas output carries none (orientation is baked in by
 *   createImageBitmap before the EXIF is dropped),
 * - format normalized to JPEG (iPhone HEIC decodes in Safari and re-encodes
 *   here; browsers that can't decode a format fail loudly instead of
 *   uploading something guests can't see).
 */
export async function reencodeToJpeg(
  file: File,
  maxDimension = 2048,
  quality = 0.85,
): Promise<Blob> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new ImageError("decode", "이미지를 읽을 수 없습니다. JPEG/PNG 파일을 사용해 주세요.");
  }

  const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new ImageError("process", "이미지를 처리할 수 없습니다.");
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", quality),
  );
  if (!blob) throw new ImageError("encode", "이미지를 변환하지 못했습니다.");
  return blob;
}
