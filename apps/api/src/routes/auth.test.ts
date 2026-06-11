import assert from "node:assert/strict";
import { after, before, beforeEach, test } from "node:test";
import { sql } from "drizzle-orm";
import type { LightMyRequestResponse } from "fastify";
import { closeDb, db } from "../db/index.js";
import { buildServer } from "../server.js";

/**
 * Exercises the Better Auth endpoints through the Fastify mount — these tests
 * pin the catch-all request/response bridging (body re-serialization,
 * set-cookie handling), not Better Auth's internals.
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

/** Extract the Better Auth session cookie from a response, ready to send back. */
function sessionCookie(res: LightMyRequestResponse): string | undefined {
  const raw = res.headers["set-cookie"];
  const cookies = Array.isArray(raw) ? raw : raw ? [raw] : [];
  const token = cookies.find((c) => c.startsWith("better-auth.session_token="));
  return token?.split(";")[0];
}

const creds = { email: "al@example.com", name: "Al", password: "supersecret1" };

function signUp(payload: object) {
  return app.inject({ method: "POST", url: "/api/auth/sign-up/email", payload });
}
function signIn(payload: object) {
  return app.inject({ method: "POST", url: "/api/auth/sign-in/email", payload });
}
function getSession(cookie?: string) {
  return app.inject({
    method: "GET",
    url: "/api/auth/get-session",
    headers: cookie ? { cookie } : {},
  });
}

test("sign-up returns the user and a session cookie", async () => {
  const res = await signUp(creds);
  assert.equal(res.statusCode, 200);
  const body = res.json();
  assert.equal(body.user.email, creds.email);
  assert.equal(body.user.name, creds.name);
  assert.ok(sessionCookie(res), "must set a session cookie");
});

test("sign-up with invalid input is rejected", async () => {
  const res = await signUp({ email: "not-an-email", name: "", password: "short" });
  assert.ok(res.statusCode >= 400, `expected 4xx, got ${res.statusCode}`);
});

test("sign-up with a duplicate email is rejected", async () => {
  await signUp(creds);
  const res = await signUp({ ...creds, name: "Al2" });
  assert.ok(res.statusCode >= 400, `expected 4xx, got ${res.statusCode}`);
});

test("sign-in works with correct credentials and rejects a wrong password", async () => {
  await signUp(creds);

  const ok = await signIn({ email: creds.email, password: creds.password });
  assert.equal(ok.statusCode, 200);
  assert.ok(sessionCookie(ok), "sign-in must set a session cookie");

  const bad = await signIn({ email: creds.email, password: "wrong-password" });
  assert.equal(bad.statusCode, 401);
});

test("get-session round-trips the cookie; absent or signed-out sessions are null", async () => {
  const signedUp = await signUp(creds);
  const cookie = sessionCookie(signedUp);
  assert.ok(cookie);

  const withCookie = await getSession(cookie);
  assert.equal(withCookie.statusCode, 200);
  assert.equal(withCookie.json()?.user?.email, creds.email);

  const without = await getSession();
  assert.ok(!without.json()?.user, "no cookie must mean no session");

  // Cookie-authenticated state-changing requests must pass Better Auth's CSRF
  // check: browsers always send Origin on fetch POSTs, so tests must too.
  const signOut = await app.inject({
    method: "POST",
    url: "/api/auth/sign-out",
    payload: {},
    headers: { cookie, origin: "http://localhost:3000" },
  });
  assert.equal(signOut.statusCode, 200);

  const afterSignOut = await getSession(cookie);
  assert.ok(!afterSignOut.json()?.user, "signed-out session must be gone");
});
