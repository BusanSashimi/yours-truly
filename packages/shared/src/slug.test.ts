import assert from "node:assert/strict";
import { test } from "node:test";
import { RESERVED_SLUGS, slugSchema } from "./index.js";

const valid = (slug: string) => slugSchema.safeParse(slug).success;

test("accepts well-formed slugs", () => {
  const good = ["minji-and-hoon", "wedding2026", "abc", "a-1-b", "0-0-7"];
  for (const slug of good) assert.ok(valid(slug), `should accept: ${slug}`);
});

test("rejects wrong charset or shape", () => {
  const bad = [
    "Minji", // uppercase
    "min ji", // space
    "민지와훈", // non-ASCII
    "-abc", // leading hyphen
    "abc-", // trailing hyphen
    "a_b", // underscore
    "a.b", // dot
    "a/b", // slash — must not escape the /invitations/ namespace
    "", // empty
  ];
  for (const slug of bad) assert.ok(!valid(slug), `should reject: ${slug}`);
});

test("enforces length bounds (3–63)", () => {
  assert.ok(!valid("ab"));
  assert.ok(valid("abc"));
  assert.ok(valid("a".repeat(63)));
  assert.ok(!valid("a".repeat(64)));
});

test("rejects reserved slugs", () => {
  for (const slug of ["new", "edit", "api", "admin", "yourstruly", "official"]) {
    assert.ok(!valid(slug), `should reject reserved: ${slug}`);
  }
});

test("every reserved entry satisfies the slug shape rules", () => {
  // A reserved entry that could never validate anyway (uppercase, too short,
  // bad charset) is dead weight and probably a typo.
  for (const slug of RESERVED_SLUGS) {
    assert.match(slug, /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/, `malformed entry: ${slug}`);
    assert.ok(slug.length >= 3 && slug.length <= 63, `bad length: ${slug}`);
  }
});
