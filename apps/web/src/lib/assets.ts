import { ASSET_KEY_REGEX } from "@yours-truly/shared";

/**
 * Asset (S3) origin. Dev defaults to the dev bucket — its CORS allows
 * localhost:3000 and keeps test uploads out of the prod bucket. Override with
 * NEXT_PUBLIC_ASSET_HOST (build-time; used in client bundles too).
 * Must stay in sync with images.remotePatterns in next.config.ts.
 */
export const ASSET_HOST =
  process.env.NEXT_PUBLIC_ASSET_HOST ??
  (process.env.NODE_ENV === "development"
    ? "yourstruly-assets-dev.s3.us-east-1.amazonaws.com"
    : "yourstruly-assets.s3.us-east-1.amazonaws.com");

export function assetUrl(key: string): string {
  return `https://${ASSET_HOST}/${key}`;
}

/**
 * A design-doc asset key is only renderable when it has the canonical shape
 * AND sits under this invitation's own prefix — anything else (foreign hosts,
 * other couples' keys) is silently ignored, never fetched or proxied.
 */
export function isRenderableAssetKey(
  key: string | undefined,
  invitationId: string,
): key is string {
  return Boolean(key && ASSET_KEY_REGEX.test(key) && key.startsWith(`i/${invitationId}/`));
}
