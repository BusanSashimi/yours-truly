import assert from "node:assert/strict";
import { after, before, beforeEach, test } from "node:test";
import { sql } from "drizzle-orm";
import type { LightMyRequestResponse } from "fastify";
import {
  createGuestUploadResponseSchema,
  guestbookListResponseSchema,
  guestUploadListResponseSchema,
  rsvpListResponseSchema,
} from "@yours-truly/shared";
import { closeDb, db } from "../db/index.js";
import { buildServer } from "../server.js";

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
    sql`TRUNCATE TABLE rsvp_responses, guestbook_entries, guest_uploads, invitations, sessions, accounts, verifications, users RESTART IDENTITY CASCADE`,
  );
});

function sessionCookie(res: LightMyRequestResponse): string {
  const raw = res.headers["set-cookie"];
  const cookies = Array.isArray(raw) ? raw : raw ? [raw] : [];
  const token = cookies.find((c) => c.startsWith("better-auth.session_token="));
  assert.ok(token, "expected a session cookie");
  return token.split(";")[0];
}

async function signUp(email = "owner@example.com"): Promise<string> {
  const res = await app.inject({
    method: "POST",
    url: "/api/auth/sign-up/email",
    payload: { email, name: "Owner", password: "supersecret1" },
  });
  return sessionCookie(res);
}

/** Create a published invitation, optionally with a design doc, return its id. */
async function publishedInvitation(
  cookie: string,
  slug: string,
  design: Record<string, unknown> = {},
): Promise<string> {
  const created = await app.inject({
    method: "POST",
    url: "/api/invitations",
    headers: { cookie },
    payload: { slug },
  });
  assert.equal(created.statusCode, 201, created.body);
  const id = created.json().invitation.id as string;
  const patched = await app.inject({
    method: "PATCH",
    url: `/api/invitations/${id}`,
    headers: { cookie },
    payload: { status: "published", design },
  });
  assert.equal(patched.statusCode, 200, patched.body);
  return id;
}

// --- RSVP ---

test("rsvp: guest submits to a published invitation; owner reads counts", async () => {
  const cookie = await signUp();
  const id = await publishedInvitation(cookie, "rsvp-demo");

  const submit = await app.inject({
    method: "POST",
    url: `/api/invitations/${id}/rsvp`,
    payload: { name: "하객", attendance: "yes", side: "groom", headcount: 3 },
  });
  assert.equal(submit.statusCode, 201, submit.body);

  const list = await app.inject({ method: "GET", url: `/api/invitations/${id}/rsvp`, headers: { cookie } });
  assert.equal(list.statusCode, 200);
  const body = rsvpListResponseSchema.parse(list.json());
  assert.equal(body.responses.length, 1);
  assert.equal(body.responses[0].name, "하객");
  assert.equal(body.counts.attending, 1);
  assert.equal(body.counts.guests, 3);
});

test("rsvp: submission to a missing/draft invitation 404s; bad input 400s", async () => {
  const cookie = await signUp();
  const draft = await app.inject({
    method: "POST",
    url: "/api/invitations",
    headers: { cookie },
    payload: { slug: "rsvp-draft" },
  });
  const draftId = draft.json().invitation.id as string;

  const toDraft = await app.inject({
    method: "POST",
    url: `/api/invitations/${draftId}/rsvp`,
    payload: { name: "x", attendance: "yes" },
  });
  assert.equal(toDraft.statusCode, 404);

  const id = await publishedInvitation(cookie, "rsvp-bad");
  const bad = await app.inject({
    method: "POST",
    url: `/api/invitations/${id}/rsvp`,
    payload: { name: "x", attendance: "maybe" },
  });
  assert.equal(bad.statusCode, 400);
});

test("rsvp: list requires auth and ownership", async () => {
  const cookie = await signUp();
  const id = await publishedInvitation(cookie, "rsvp-priv");

  const anon = await app.inject({ method: "GET", url: `/api/invitations/${id}/rsvp` });
  assert.equal(anon.statusCode, 401);

  const other = await signUp("other@example.com");
  const foreign = await app.inject({ method: "GET", url: `/api/invitations/${id}/rsvp`, headers: { cookie: other } });
  assert.equal(foreign.statusCode, 404);
});

// --- Guestbook ---

test("guestbook: public write + paginated read; owner & PIN delete", async () => {
  const cookie = await signUp();
  const id = await publishedInvitation(cookie, "gb-demo");

  const a = await app.inject({
    method: "POST",
    url: `/api/invitations/${id}/guestbook`,
    payload: { name: "친구", message: "축하해요" },
  });
  assert.equal(a.statusCode, 201);
  const b = await app.inject({
    method: "POST",
    url: `/api/invitations/${id}/guestbook`,
    payload: { name: "지인", message: "행복하세요", pin: "1234" },
  });
  const bId = b.json().entry.id as string;

  const list = await app.inject({ method: "GET", url: `/api/invitations/${id}/guestbook` });
  const body = guestbookListResponseSchema.parse(list.json());
  assert.equal(body.total, 2);
  // PIN/hash never serialized
  assert.ok(!JSON.stringify(body).includes("pin"));

  // wrong PIN can't delete
  const wrong = await app.inject({
    method: "DELETE",
    url: `/api/invitations/${id}/guestbook/${bId}`,
    payload: { pin: "0000" },
  });
  assert.equal(wrong.statusCode, 403);

  // correct PIN deletes
  const right = await app.inject({
    method: "DELETE",
    url: `/api/invitations/${id}/guestbook/${bId}`,
    payload: { pin: "1234" },
  });
  assert.equal(right.statusCode, 204);

  // owner can delete the other (no PIN) entry for moderation
  const aId = a.json().entry.id as string;
  const ownerDel = await app.inject({
    method: "DELETE",
    url: `/api/invitations/${id}/guestbook/${aId}`,
    headers: { cookie },
  });
  assert.equal(ownerDel.statusCode, 204);

  const after = await app.inject({ method: "GET", url: `/api/invitations/${id}/guestbook` });
  assert.equal(guestbookListResponseSchema.parse(after.json()).total, 0);
});

// --- Guest uploads ---

test("guest-uploads: gated by the open window, then presign + confirm + list", async () => {
  const cookie = await signUp();
  // disabled by default
  const disabledId = await publishedInvitation(cookie, "gu-off");
  const off = await app.inject({
    method: "POST",
    url: `/api/invitations/${disabledId}/guest-uploads`,
    payload: { contentType: "image/jpeg", size: 1000 },
  });
  assert.equal(off.statusCode, 403);
  assert.equal(off.json().error.code, "guest_upload_disabled");

  // enabled but opens in the future
  const futureId = await publishedInvitation(cookie, "gu-future", {
    guestUpload: { enabled: true, openDate: "2999-01-01T00:00:00.000Z" },
  });
  const notOpen = await app.inject({
    method: "POST",
    url: `/api/invitations/${futureId}/guest-uploads`,
    payload: { contentType: "image/jpeg", size: 1000 },
  });
  assert.equal(notOpen.statusCode, 403);
  assert.equal(notOpen.json().error.code, "guest_upload_not_open");

  // enabled + open
  const id = await publishedInvitation(cookie, "gu-open", {
    guestUpload: { enabled: true, openDate: "2020-01-01T00:00:00.000Z" },
  });
  const presign = await app.inject({
    method: "POST",
    url: `/api/invitations/${id}/guest-uploads`,
    payload: { contentType: "image/jpeg", size: 1000 },
  });
  assert.equal(presign.statusCode, 200, presign.body);
  const { key } = createGuestUploadResponseSchema.parse(presign.json());
  assert.ok(key.startsWith(`g/${id}/`));
  assert.ok(key.endsWith(".jpg"));

  // key from another invitation is rejected on confirm
  const crossKey = `g/${futureId}/00000000-0000-4000-8000-000000000000.jpg`;
  const cross = await app.inject({
    method: "POST",
    url: `/api/invitations/${id}/guest-uploads/confirm`,
    payload: { key: crossKey },
  });
  assert.equal(cross.statusCode, 400);

  const confirm = await app.inject({
    method: "POST",
    url: `/api/invitations/${id}/guest-uploads/confirm`,
    payload: { key, uploaderName: "하객" },
  });
  assert.equal(confirm.statusCode, 201, confirm.body);

  const list = await app.inject({ method: "GET", url: `/api/invitations/${id}/guest-uploads` });
  const body = guestUploadListResponseSchema.parse(list.json());
  assert.equal(body.uploads.length, 1);
  assert.equal(body.uploads[0].key, key);
});
