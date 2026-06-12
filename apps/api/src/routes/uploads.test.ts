import assert from "node:assert/strict";
import { after, before, beforeEach, test } from "node:test";
import { sql } from "drizzle-orm";
import type { LightMyRequestResponse } from "fastify";
import { createUploadResponseSchema } from "@yours-truly/shared";
import { closeDb, db } from "../db/index.js";
import { buildServer } from "../server.js";

/**
 * Presigning is local signing — these tests run offline against the fake AWS
 * credentials in the test script env (S3_BUCKET=test-assets-bucket).
 */
const app = buildServer();

before(async () => {
  await app.ready();
});

after(async () => {
  await app.close();
  await closeDb();
});

beforeEach(async () => {
  await db.execute(
    sql`TRUNCATE TABLE invitations, sessions, accounts, verifications, users RESTART IDENTITY CASCADE`,
  );
});

function sessionCookie(res: LightMyRequestResponse): string | undefined {
  const raw = res.headers["set-cookie"];
  const cookies = Array.isArray(raw) ? raw : raw ? [raw] : [];
  const token = cookies.find((c) => c.startsWith("better-auth.session_token="));
  return token?.split(";")[0];
}

async function signUpAndCreateInvitation(email = "owner@example.com", slug = "minji-and-hoon") {
  const up = await app.inject({
    method: "POST",
    url: "/api/auth/sign-up/email",
    payload: { email, name: "Owner", password: "supersecret1" },
  });
  const cookie = sessionCookie(up);
  assert.ok(cookie);
  const created = await app.inject({
    method: "POST",
    url: "/api/invitations",
    payload: { slug },
    headers: { cookie },
  });
  assert.equal(created.statusCode, 201);
  return { cookie, invitationId: created.json().invitation.id as string };
}

function presign(cookie: string | undefined, payload: object) {
  return app.inject({
    method: "POST",
    url: "/api/uploads",
    payload,
    headers: cookie ? { cookie } : {},
  });
}

const goodPayload = (invitationId: string) => ({
  invitationId,
  contentType: "image/jpeg",
  size: 123456,
});

test("presign requires auth", async () => {
  const res = await presign(undefined, goodPayload("3b4cf3f3-0000-4000-8000-000000000000"));
  assert.equal(res.statusCode, 401);
});

test("presign returns a usable, checksum-free, type+size-bound URL", async () => {
  const { cookie, invitationId } = await signUpAndCreateInvitation();
  const res = await presign(cookie, goodPayload(invitationId));
  assert.equal(res.statusCode, 200);

  const body = createUploadResponseSchema.parse(res.json());
  assert.ok(body.key.startsWith(`i/${invitationId}/`), "key scoped to the invitation prefix");
  assert.ok(body.key.endsWith(".jpg"));
  assert.equal(body.publicUrl, `https://test-assets-bucket.s3.us-east-1.amazonaws.com/${body.key}`);

  const url = new URL(body.uploadUrl);
  assert.equal(url.hostname, "test-assets-bucket.s3.us-east-1.amazonaws.com");
  // Regression for the SDK >=3.729.0 default: an empty-body CRC32 signed into
  // the URL makes every real upload fail with XAmzContentChecksumMismatch.
  assert.ok(!body.uploadUrl.includes("x-amz-checksum"), "no checksum params in presigned URL");
  assert.ok(!body.uploadUrl.includes("x-amz-sdk-checksum"), "no sdk-checksum params");
  // Content type and exact length must be signature-bound.
  const signed = url.searchParams.get("X-Amz-SignedHeaders") ?? "";
  assert.ok(signed.includes("content-type"), `content-type signed (got: ${signed})`);
  assert.ok(signed.includes("content-length"), `content-length signed (got: ${signed})`);
});

test("presign 404s for another user's invitation", async () => {
  const { invitationId } = await signUpAndCreateInvitation();
  const other = await signUpAndCreateInvitation("other@example.com", "other-slug");
  const res = await presign(other.cookie, goodPayload(invitationId));
  assert.equal(res.statusCode, 404);
});

test("presign rejects bad content types and oversized files", async () => {
  const { cookie, invitationId } = await signUpAndCreateInvitation();

  const svg = await presign(cookie, {
    invitationId,
    contentType: "image/svg+xml",
    size: 1000,
  });
  assert.equal(svg.statusCode, 400, "svg must be rejected (scriptable format)");

  const huge = await presign(cookie, {
    invitationId,
    contentType: "image/jpeg",
    size: 11 * 1024 * 1024,
  });
  assert.equal(huge.statusCode, 400);
});

// Keep this test LAST: it exhausts the shared per-IP rate-limit budget.
test("presign is rate limited", async () => {
  const { cookie, invitationId } = await signUpAndCreateInvitation();
  let limited = false;
  for (let i = 0; i < 32; i++) {
    const res = await presign(cookie, goodPayload(invitationId));
    if (res.statusCode === 429) {
      limited = true;
      break;
    }
    assert.equal(res.statusCode, 200);
  }
  assert.ok(limited, "expected a 429 within the rate-limit window");
});
