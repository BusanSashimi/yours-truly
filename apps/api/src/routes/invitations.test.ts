import assert from "node:assert/strict";
import { after, before, beforeEach, test } from "node:test";
import { sql } from "drizzle-orm";
import type { LightMyRequestResponse } from "fastify";
import { invitationResponseSchema } from "@yours-truly/shared";
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
    sql`TRUNCATE TABLE invitations, sessions, accounts, verifications, users RESTART IDENTITY CASCADE`,
  );
});

/** Extract the Better Auth session cookie from a response, ready to send back. */
function sessionCookie(res: LightMyRequestResponse): string | undefined {
  const raw = res.headers["set-cookie"];
  const cookies = Array.isArray(raw) ? raw : raw ? [raw] : [];
  const token = cookies.find((c) => c.startsWith("better-auth.session_token="));
  return token?.split(";")[0];
}

/** Register a user and return their session cookie. */
async function signUp(email = "owner@example.com"): Promise<string> {
  const res = await app.inject({
    method: "POST",
    url: "/api/auth/sign-up/email",
    payload: { email, name: "Owner", password: "supersecret1" },
  });
  const cookie = sessionCookie(res);
  assert.ok(cookie, "sign-up must set a session cookie");
  return cookie;
}

function create(cookie: string | undefined, payload: object) {
  return app.inject({
    method: "POST",
    url: "/api/invitations",
    payload,
    headers: cookie ? { cookie } : {},
  });
}

test("create requires auth", async () => {
  const res = await create(undefined, { slug: "minji-and-hoon" });
  assert.equal(res.statusCode, 401);
  assert.equal(res.json().error.code, "unauthenticated");
});

test("create returns 201 with a draft invitation matching the wire contract", async () => {
  const cookie = await signUp();
  const res = await create(cookie, { slug: "minji-and-hoon" });
  assert.equal(res.statusCode, 201);

  const { invitation } = invitationResponseSchema.parse(res.json());
  assert.equal(invitation.slug, "minji-and-hoon");
  assert.equal(invitation.status, "draft");
  assert.deepEqual(invitation.design, {});
  assert.ok(!("userId" in invitation), "must not leak the owner id");
});

test("create rejects invalid and reserved slugs", async () => {
  const cookie = await signUp();
  for (const slug of ["Bad Slug!", "ab", "-abc", "admin", "new"]) {
    const res = await create(cookie, { slug });
    assert.equal(res.statusCode, 400, `should reject slug: ${slug}`);
    assert.equal(res.json().error.code, "invalid_input");
  }
});

test("create returns 409 when the slug is taken, even by another user", async () => {
  const cookie = await signUp();
  assert.equal((await create(cookie, { slug: "minji-and-hoon" })).statusCode, 201);

  const otherCookie = await signUp("other@example.com");
  const res = await create(otherCookie, { slug: "minji-and-hoon" });
  assert.equal(res.statusCode, 409);
  assert.equal(res.json().error.code, "slug_taken");
});

test("list returns only the signed-in user's invitations", async () => {
  const cookie = await signUp();
  await create(cookie, { slug: "mine-one" });
  await create(cookie, { slug: "mine-two" });
  const otherCookie = await signUp("other@example.com");
  await create(otherCookie, { slug: "not-mine" });

  const res = await app.inject({ method: "GET", url: "/api/invitations", headers: { cookie } });
  assert.equal(res.statusCode, 200);
  const slugs = res.json().invitations.map((i: { slug: string }) => i.slug);
  assert.deepEqual(slugs.sort(), ["mine-one", "mine-two"]);

  const unauthed = await app.inject({ method: "GET", url: "/api/invitations" });
  assert.equal(unauthed.statusCode, 401);
});

test("get by id is owner-only and 404s on foreign or malformed ids", async () => {
  const cookie = await signUp();
  const created = (await create(cookie, { slug: "minji-and-hoon" })).json();
  const id = created.invitation.id;

  const own = await app.inject({ method: "GET", url: `/api/invitations/${id}`, headers: { cookie } });
  assert.equal(own.statusCode, 200);
  assert.equal(own.json().invitation.id, id);

  const otherCookie = await signUp("other@example.com");
  const foreign = await app.inject({
    method: "GET",
    url: `/api/invitations/${id}`,
    headers: { cookie: otherCookie },
  });
  assert.equal(foreign.statusCode, 404, "foreign invitations must look nonexistent");

  const malformed = await app.inject({
    method: "GET",
    url: "/api/invitations/not-a-uuid",
    headers: { cookie },
  });
  assert.equal(malformed.statusCode, 404);
});

test("patch updates design and status", async () => {
  const cookie = await signUp();
  const created = (await create(cookie, { slug: "minji-and-hoon" })).json();

  const res = await app.inject({
    method: "PATCH",
    url: `/api/invitations/${created.invitation.id}`,
    payload: { status: "published", design: { theme: "letterpress" } },
    headers: { cookie },
  });
  assert.equal(res.statusCode, 200);
  const { invitation } = invitationResponseSchema.parse(res.json());
  assert.equal(invitation.status, "published");
  assert.deepEqual(invitation.design, { theme: "letterpress" });
});

test("patch rejects an empty patch and a taken slug", async () => {
  const cookie = await signUp();
  await create(cookie, { slug: "taken-already" });
  const created = (await create(cookie, { slug: "minji-and-hoon" })).json();
  const url = `/api/invitations/${created.invitation.id}`;

  const empty = await app.inject({ method: "PATCH", url, payload: {}, headers: { cookie } });
  assert.equal(empty.statusCode, 400);

  const conflict = await app.inject({
    method: "PATCH",
    url,
    payload: { slug: "taken-already" },
    headers: { cookie },
  });
  assert.equal(conflict.statusCode, 409);
  assert.equal(conflict.json().error.code, "slug_taken");
});

test("delete removes the invitation; foreign deletes 404 and change nothing", async () => {
  const cookie = await signUp();
  const created = (await create(cookie, { slug: "minji-and-hoon" })).json();
  const url = `/api/invitations/${created.invitation.id}`;

  const otherCookie = await signUp("other@example.com");
  const foreign = await app.inject({ method: "DELETE", url, headers: { cookie: otherCookie } });
  assert.equal(foreign.statusCode, 404);

  const res = await app.inject({ method: "DELETE", url, headers: { cookie } });
  assert.equal(res.statusCode, 204);

  const gone = await app.inject({ method: "GET", url, headers: { cookie } });
  assert.equal(gone.statusCode, 404);
});

test("by-slug is public but only serves published invitations", async () => {
  const cookie = await signUp();
  const created = (await create(cookie, { slug: "minji-and-hoon", design: { theme: "letterpress" } })).json();

  // Draft: invisible to the public — even to its signed-in owner via this route.
  const draft = await app.inject({ method: "GET", url: "/api/invitations/by-slug/minji-and-hoon" });
  assert.equal(draft.statusCode, 404);

  await app.inject({
    method: "PATCH",
    url: `/api/invitations/${created.invitation.id}`,
    payload: { status: "published" },
    headers: { cookie },
  });

  // No cookie: this is the guest's view.
  const published = await app.inject({ method: "GET", url: "/api/invitations/by-slug/minji-and-hoon" });
  assert.equal(published.statusCode, 200);
  const { invitation } = invitationResponseSchema.parse(published.json());
  assert.equal(invitation.slug, "minji-and-hoon");
  assert.deepEqual(invitation.design, { theme: "letterpress" });

  const missing = await app.inject({ method: "GET", url: "/api/invitations/by-slug/no-such-slug" });
  assert.equal(missing.statusCode, 404);
});
