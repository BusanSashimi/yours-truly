import assert from "node:assert/strict";
import { after, before, beforeEach, test } from "node:test";
import { sql } from "drizzle-orm";
import type { LightMyRequestResponse } from "fastify";
import {
  createGuestMessagePresignResponseSchema,
  createGuestUploadResponseSchema,
  guestbookListResponseSchema,
  guestMessageListResponseSchema,
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
    sql`TRUNCATE TABLE rsvp_responses, guestbook_entries, guest_uploads, guest_messages, invitations, sessions, accounts, verifications, users RESTART IDENTITY CASCADE`,
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

// --- Guest messages (private QR inbox) ---

/** Presign a message-photo upload and return the validated m/<id>/ key. */
async function presignMessageKey(id: string): Promise<string> {
  const res = await app.inject({
    method: "POST",
    url: `/api/invitations/${id}/messages/presign`,
    payload: { contentType: "image/jpeg", size: 1000 },
  });
  assert.equal(res.statusCode, 200, res.body);
  return createGuestMessagePresignResponseSchema.parse(res.json()).key;
}

test("guest-messages: gated by the open window, then presign", async () => {
  const cookie = await signUp();
  // disabled by default
  const disabledId = await publishedInvitation(cookie, "gm-off");
  const off = await app.inject({
    method: "POST",
    url: `/api/invitations/${disabledId}/messages/presign`,
    payload: { contentType: "image/jpeg", size: 1000 },
  });
  assert.equal(off.statusCode, 403);
  assert.equal(off.json().error.code, "guest_message_disabled");

  // enabled but opens in the future
  const futureId = await publishedInvitation(cookie, "gm-future", {
    guestMessages: { enabled: true, openDate: "2999-01-01T00:00:00.000Z" },
  });
  const notOpen = await app.inject({
    method: "POST",
    url: `/api/invitations/${futureId}/messages/presign`,
    payload: { contentType: "image/jpeg", size: 1000 },
  });
  assert.equal(notOpen.statusCode, 403);
  assert.equal(notOpen.json().error.code, "guest_message_not_open");

  // enabled + open
  const id = await publishedInvitation(cookie, "gm-open", {
    guestMessages: { enabled: true, openDate: "2020-01-01T00:00:00.000Z" },
  });
  const key = await presignMessageKey(id);
  assert.ok(key.startsWith(`m/${id}/`));
  assert.ok(key.endsWith(".jpg"));
});

test("guest-messages: create accepts message-only / photos-only / both; rejects empty, foreign key, over-cap", async () => {
  const cookie = await signUp();
  const id = await publishedInvitation(cookie, "gm-create", {
    guestMessages: { enabled: true, openDate: "2020-01-01T00:00:00.000Z" },
  });

  // message only
  const msgOnly = await app.inject({
    method: "POST",
    url: `/api/invitations/${id}/messages`,
    payload: { senderName: "하객", message: "축하해요" },
  });
  assert.equal(msgOnly.statusCode, 201, msgOnly.body);

  // photos only
  const photosOnly = await app.inject({
    method: "POST",
    url: `/api/invitations/${id}/messages`,
    payload: { photoKeys: [await presignMessageKey(id)] },
  });
  assert.equal(photosOnly.statusCode, 201, photosOnly.body);

  // both
  const both = await app.inject({
    method: "POST",
    url: `/api/invitations/${id}/messages`,
    payload: { message: "사진과 함께", photoKeys: [await presignMessageKey(id)] },
  });
  assert.equal(both.statusCode, 201, both.body);

  // neither message nor photos → 400
  const empty = await app.inject({
    method: "POST",
    url: `/api/invitations/${id}/messages`,
    payload: { senderName: "익명" },
  });
  assert.equal(empty.statusCode, 400);

  // a key minted for another invitation → 400
  const other = await publishedInvitation(cookie, "gm-other", {
    guestMessages: { enabled: true, openDate: "2020-01-01T00:00:00.000Z" },
  });
  const foreign = await app.inject({
    method: "POST",
    url: `/api/invitations/${id}/messages`,
    payload: { photoKeys: [await presignMessageKey(other)] },
  });
  assert.equal(foreign.statusCode, 400);

  // over the per-message photo cap → 400
  const tooMany = Array.from(
    { length: 11 },
    (_, i) => `m/${id}/00000000-0000-4000-8000-${String(i).padStart(12, "0")}.jpg`,
  );
  const over = await app.inject({
    method: "POST",
    url: `/api/invitations/${id}/messages`,
    payload: { photoKeys: tooMany },
  });
  assert.equal(over.statusCode, 400);
});

test("guest-messages: owner lists with presigned photo urls + unread, marks read, deletes; non-owner blocked", async () => {
  const cookie = await signUp();
  const id = await publishedInvitation(cookie, "gm-inbox", {
    guestMessages: { enabled: true, openDate: "2020-01-01T00:00:00.000Z" },
  });

  const key = await presignMessageKey(id);
  const created = await app.inject({
    method: "POST",
    url: `/api/invitations/${id}/messages`,
    payload: { senderName: "하객", message: "축하합니다", photoKeys: [key] },
  });
  assert.equal(created.statusCode, 201, created.body);
  const msgId = created.json().message.id as string;

  // anonymous read → 401; a different signed-in user → 404 (not their invitation)
  const anon = await app.inject({ method: "GET", url: `/api/invitations/${id}/messages` });
  assert.equal(anon.statusCode, 401);
  const other = await signUp("other@example.com");
  const foreign = await app.inject({
    method: "GET",
    url: `/api/invitations/${id}/messages`,
    headers: { cookie: other },
  });
  assert.equal(foreign.statusCode, 404);

  // owner read → one message, one presigned photo url, unread = 1
  const list = await app.inject({
    method: "GET",
    url: `/api/invitations/${id}/messages`,
    headers: { cookie },
  });
  assert.equal(list.statusCode, 200, list.body);
  const body = guestMessageListResponseSchema.parse(list.json());
  assert.equal(body.total, 1);
  assert.equal(body.unread, 1);
  assert.equal(body.messages[0].photos.length, 1);
  assert.equal(body.messages[0].photos[0].key, key);
  assert.match(body.messages[0].photos[0].url, /X-Amz-Signature=/);

  // mark read → unread drops to 0
  const read = await app.inject({
    method: "PATCH",
    url: `/api/invitations/${id}/messages/${msgId}/read`,
    headers: { cookie },
  });
  assert.equal(read.statusCode, 204);
  const list2 = await app.inject({
    method: "GET",
    url: `/api/invitations/${id}/messages`,
    headers: { cookie },
  });
  assert.equal(guestMessageListResponseSchema.parse(list2.json()).unread, 0);

  // anonymous delete → 401
  const anonDel = await app.inject({
    method: "DELETE",
    url: `/api/invitations/${id}/messages/${msgId}`,
  });
  assert.equal(anonDel.statusCode, 401);

  // owner delete → 204, inbox empties (S3 cleanup is best-effort/fire-and-forget)
  const del = await app.inject({
    method: "DELETE",
    url: `/api/invitations/${id}/messages/${msgId}`,
    headers: { cookie },
  });
  assert.equal(del.statusCode, 204);
  const list3 = await app.inject({
    method: "GET",
    url: `/api/invitations/${id}/messages`,
    headers: { cookie },
  });
  assert.equal(guestMessageListResponseSchema.parse(list3.json()).total, 0);
});
