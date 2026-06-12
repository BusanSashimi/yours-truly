# S3 image pipeline (2026-06-12)

> What was provisioned, why it's shaped this way, and the follow-ups. Companion
> to the code in `apps/api/src/s3.ts`, `apps/api/src/routes/uploads.ts`, and
> `apps/web/src/lib/assets.ts` / `image-processing.ts`.

## Flow

1. Editor re-encodes the chosen photo **client-side** (canvas → JPEG, ≤2048px,
   q0.85). This bounds bytes (KakaoTalk's og:image scraper caps at 5MB),
   strips EXIF (GPS/device/timestamps — the bucket is public), and normalizes
   iPhone HEIC.
2. `POST /api/uploads` (cookie auth, rate-limited 30/10min) verifies the
   invitation belongs to the caller and returns a presigned PUT for
   `i/<invitationId>/<uuid>.jpg` — **ContentType and exact ContentLength are
   signature-bound**, so type and size are enforced cryptographically.
3. Browser PUTs directly to S3 (no API bandwidth), then the **key** is saved
   into the design doc (`heroImageKey`) through the editor's normal
   merge-and-save PATCH.
4. Renderers derive the URL from the configured asset host and refuse any key
   that isn't `i/<thisInvitationId>/…` — foreign URLs and other couples'
   photos can't be smuggled into a page or og:image.
5. Deleting an invitation best-effort deletes its whole `i/<id>/` prefix
   (photos of deleted invitations must not stay publicly fetchable — PIPA).

## SDK trap worth knowing (regression-tested)

`@aws-sdk/client-s3` ≥ 3.729.0 (Jan 2025 "default integrity protections")
poisons presigned PUT URLs with an empty-body CRC32 (`x-amz-checksum-crc32=AAAAAA==`)
that every real upload then fails to match. Verified still present in 3.1067.0.
The client in `s3.ts` sets `requestChecksumCalculation: "WHEN_REQUIRED"`, and
`uploads.test.ts` asserts no checksum params appear in the URL. Also:
Content-Type is NOT signed unless passed via `signableHeaders`.

## Infra as applied (aws CLI, account 905418455758, us-east-1)

Two buckets — prod and dev — so localhost CORS never points at prod data:

```bash
for B in yourstruly-assets yourstruly-assets-dev; do
  aws s3api create-bucket --bucket $B --region us-east-1
  # ACL-related blocks stay ON; only policy-based public read is allowed:
  aws s3api put-public-access-block --bucket $B --public-access-block-configuration \
    BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=false,RestrictPublicBuckets=false
  # Public GetObject on i/* ONLY — no ListBucket, keys stay unguessable:
  aws s3api put-bucket-policy --bucket $B --policy '{"Version":"2012-10-17","Statement":[{"Sid":"PublicReadUploads","Effect":"Allow","Principal":"*","Action":"s3:GetObject","Resource":"arn:aws:s3:::'$B'/i/*"}]}'
done
# CORS: PUT only, from exactly one origin each
aws s3api put-bucket-cors --bucket yourstruly-assets --cors-configuration \
  '{"CORSRules":[{"AllowedHeaders":["Content-Type"],"AllowedMethods":["PUT"],"AllowedOrigins":["https://www.yourstruly.it"],"ExposeHeaders":["ETag"],"MaxAgeSeconds":3000}]}'
aws s3api put-bucket-cors --bucket yourstruly-assets-dev --cors-configuration \
  '{"CORSRules":[{"AllowedHeaders":["Content-Type"],"AllowedMethods":["PUT"],"AllowedOrigins":["http://localhost:3000"],"ExposeHeaders":["ETag"],"MaxAgeSeconds":3000}]}'
```

Server env (`/etc/yours-truly/api.env`): `S3_BUCKET=yourstruly-assets`,
`S3_REGION=us-east-1`. The API uses the instance role's credentials.

Local dev: add `S3_BUCKET=yourstruly-assets-dev` to `apps/api/.env` and have
ambient AWS credentials (`~/.aws`); without `S3_BUCKET` the endpoint returns
503 and the editor shows "업로드가 설정되지 않았습니다". The web app defaults its
asset host to the dev bucket under `next dev` (override:
`NEXT_PUBLIC_ASSET_HOST`).

nginx: `/_next/image` is rate-limited (`limit_req zone=imgopt`, 10r/s burst 25
per IP) — each cold-cache request is a sharp decode on the only box.

## IAM — important follow-up

No IAM changes were made: the box's `aws-code-deploy` role **already has
`AmazonS3FullAccess`** (plus `AmazonEC2FullAccess` and RDS provisioning — the
same role whose credentials were stolen in the 2026-06-09 incident). The right
end state is a dedicated instance role with only
`s3:PutObject` on `arn:aws:s3:::yourstruly-assets/i/*` (+ List/Delete for the
cleanup path) and SSM core, with the provisioning policies dropped. That swap
needs console/IAM access I don't have — tracked here deliberately.

## Accepted limitations / later

- Replaced (not deleted) images orphan under the prefix until invitation
  deletion; add an S3 lifecycle rule or reconciliation later.
- Bytes aren't verified to be real images (type/size are bound, content
  isn't): an account holder could host arbitrary bytes labeled image/jpeg
  under a public uuid URL. Rate limit + 10MB cap bound the abuse; revisit with
  server-side validation if it becomes real.
- KakaoTalk caches og scrapes ~100 days — after changing a hero, purge via the
  [Kakao link debugger](https://developers.kakao.com/tool/clear/og) if the old
  preview sticks.
- CDN (CloudFront, Seoul POPs) stays a roadmap item; keys-not-URLs in the
  design docs make that cutover a config change.
