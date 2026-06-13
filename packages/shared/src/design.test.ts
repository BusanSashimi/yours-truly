import assert from "node:assert/strict";
import { test } from "node:test";
import {
  confirmGuestUploadInputSchema,
  createGuestUploadInputSchema,
  createGuestbookInputSchema,
  createRsvpInputSchema,
  invitationDesignFieldsSchema,
} from "./index.js";

const IMG = "i/11111111-1111-4111-8111-111111111111/22222222-2222-4222-8222-222222222222.jpg";
const GUEST_IMG = "g/11111111-1111-4111-8111-111111111111/33333333-3333-4333-8333-333333333333.jpg";

test("a fully-populated rich design parses and round-trips its values", () => {
  const parsed = invitationDesignFieldsSchema.safeParse({
    template: "ivory-editorial",
    groomName: "김도연",
    brideName: "이지유",
    galleryImageKeys: [IMG, IMG],
    profiles: { groom: { birth: "1990", mbti: "ESFJ", traits: ["다정함"] } },
    parents: { groomFather: { name: "김종혁", deceased: false } },
    contacts: [{ label: "신랑", phone: "010-0000-0000" }],
    timeline: [{ date: "2021", label: "첫 만남", imageKey: IMG }],
    relationshipStartDate: "2018-03-01T00:00:00.000Z",
    interview: [{ question: "첫인상은?", groomAnswer: "밝았어요" }],
    map: { lat: 37.5, lng: 127.0, naverUrl: "https://map.naver.com/p/x" },
    transit: { subway: "2호선 강남역" },
    reception: { venue: "연회장", note: "식후 안내" },
    accounts: [{ side: "groom", bank: "국민", number: "123", holder: "김도연" }],
    tabs: { parking: { text: "발렛 가능" } },
    wreathUrl: "https://example.com/wreath",
    guestUpload: { enabled: true, openDate: "2026-10-18T00:00:00+09:00" },
    rsvpEnabled: true,
    guestbookEnabled: true,
  });
  assert.ok(parsed.success);
  if (parsed.success) {
    assert.equal(parsed.data.galleryImageKeys?.length, 2);
    assert.equal(parsed.data.profiles?.groom?.mbti, "ESFJ");
    assert.equal(parsed.data.accounts?.[0]?.bank, "국민");
    assert.equal(parsed.data.rsvpEnabled, true);
  }
});

test("one malformed rich field drops alone; the rest of the doc survives", () => {
  const parsed = invitationDesignFieldsSchema.safeParse({
    groomName: "김도연",
    accounts: "not-an-array", // wrong type
    galleryImageKeys: ["https://evil.example/x.jpg"], // not an asset key
    map: { lat: "nope" }, // wrong leaf type → whole map drops
    rsvpEnabled: true,
  });
  assert.ok(parsed.success);
  if (parsed.success) {
    assert.equal(parsed.data.groomName, "김도연");
    assert.equal(parsed.data.accounts, undefined);
    assert.equal(parsed.data.galleryImageKeys, undefined);
    assert.equal(parsed.data.map, undefined);
    assert.equal(parsed.data.rsvpEnabled, true);
  }
});

test("RSVP input validates and bounds guest-supplied values", () => {
  assert.ok(createRsvpInputSchema.safeParse({ name: "하객", attendance: "yes" }).success);
  assert.ok(!createRsvpInputSchema.safeParse({ name: "", attendance: "yes" }).success);
  assert.ok(!createRsvpInputSchema.safeParse({ name: "x", attendance: "maybe" }).success);
  assert.ok(!createRsvpInputSchema.safeParse({ name: "x", attendance: "yes", headcount: 999 }).success);
});

test("guestbook input bounds length and PIN shape", () => {
  assert.ok(createGuestbookInputSchema.safeParse({ name: "하객", message: "축하해요" }).success);
  assert.ok(createGuestbookInputSchema.safeParse({ name: "a", message: "m", pin: "1234" }).success);
  assert.ok(!createGuestbookInputSchema.safeParse({ name: "a", message: "" }).success);
  assert.ok(!createGuestbookInputSchema.safeParse({ name: "a", message: "m", pin: "12" }).success);
});

test("guest upload input enforces content-type, size cap, and key prefix", () => {
  assert.ok(
    createGuestUploadInputSchema.safeParse({ contentType: "image/jpeg", size: 1000 }).success,
  );
  assert.ok(
    !createGuestUploadInputSchema.safeParse({ contentType: "image/gif", size: 1000 }).success,
  );
  assert.ok(
    !createGuestUploadInputSchema.safeParse({ contentType: "image/jpeg", size: 99_000_000 }).success,
  );
  // confirm requires the g/ guest prefix, not the couple's i/ prefix
  assert.ok(confirmGuestUploadInputSchema.safeParse({ key: GUEST_IMG }).success);
  assert.ok(!confirmGuestUploadInputSchema.safeParse({ key: IMG }).success);
});
