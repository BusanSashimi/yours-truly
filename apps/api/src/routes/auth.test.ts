import assert from "node:assert/strict";
import { after, before, beforeEach, test } from "node:test";
import { sql } from "drizzle-orm";
import type { LightMyRequestResponse } from "fastify";
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
  await db.execute(sql`TRUNCATE TABLE sessions, users RESTART IDENTITY CASCADE`);
});

/** Extract the `sid=...` session cookie from a response, ready to send back. */
function sessionCookie(res: LightMyRequestResponse): string | undefined {
  const raw = res.headers["set-cookie"];
  const cookies = Array.isArray(raw) ? raw : raw ? [raw] : [];
  const sid = cookies.find((c) => c.startsWith("sid="));
  return sid?.split(";")[0];
}

const creds = { email: "al@example.com", name: "Al", password: "supersecret1" };

function register(payload: object) {
  return app.inject({ method: "POST", url: "/api/auth/register", payload });
}
function login(payload: object) {
  return app.inject({ method: "POST", url: "/api/auth/login", payload });
}

test("register with valid input returns 201, the user, and a session cookie", async () => {
  const res = await register(creds);
  assert.equal(res.statusCode, 201);
  const body = res.json();
  assert.equal(body.user.email, creds.email);
  assert.equal(body.user.name, creds.name);
  assert.ok(!("passwordHash" in body.user), "must not leak passwordHash");
  assert.ok(sessionCookie(res), "must set a session cookie");
});

test("register with invalid input returns 400", async () => {
  const res = await register({ email: "not-an-email", name: "", password: "short" });
  assert.equal(res.statusCode, 400);
  assert.equal(res.json().error.code, "invalid_input");
});

test("register with a duplicate email returns 409", async () => {
  await register(creds);
  const res = await register({ ...creds, name: "Al2" });
  assert.equal(res.statusCode, 409);
  assert.equal(res.json().error.code, "email_taken");
});

test("login with the wrong password returns 401", async () => {
  await register(creds);
  const res = await login({ email: creds.email, password: "wrongpassword" });
  assert.equal(res.statusCode, 401);
  assert.equal(res.json().error.code, "invalid_credentials");
});

test("login with the correct password returns 200 and a session cookie", async () => {
  await register(creds);
  const res = await login({ email: creds.email, password: creds.password });
  assert.equal(res.statusCode, 200);
  assert.equal(res.json().user.email, creds.email);
  assert.ok(sessionCookie(res), "must set a session cookie");
});

test("me returns the user when given a valid session cookie", async () => {
  const cookie = sessionCookie(await register(creds))!;
  const res = await app.inject({ method: "GET", url: "/api/auth/me", headers: { cookie } });
  assert.equal(res.statusCode, 200);
  assert.equal(res.json().user.email, creds.email);
});

test("me returns 401 without a session cookie", async () => {
  const res = await app.inject({ method: "GET", url: "/api/auth/me" });
  assert.equal(res.statusCode, 401);
  assert.equal(res.json().error.code, "unauthenticated");
});

test("logout invalidates the session so me returns 401", async () => {
  const cookie = sessionCookie(await register(creds))!;
  const out = await app.inject({ method: "POST", url: "/api/auth/logout", headers: { cookie } });
  assert.equal(out.statusCode, 204);
  const res = await app.inject({ method: "GET", url: "/api/auth/me", headers: { cookie } });
  assert.equal(res.statusCode, 401);
});
