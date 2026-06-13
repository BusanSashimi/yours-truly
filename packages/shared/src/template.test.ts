import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DEFAULT_INVITATION_TEMPLATE_ID,
  INVITATION_TEMPLATE_IDS,
  invitationDesignFieldsSchema,
  resolveInvitationTemplateId,
} from "./index.js";

test("every template id resolves to itself", () => {
  for (const id of INVITATION_TEMPLATE_IDS) {
    assert.equal(resolveInvitationTemplateId(id), id);
  }
});

test("unknown or missing template values resolve to the default", () => {
  assert.ok(INVITATION_TEMPLATE_IDS.includes(DEFAULT_INVITATION_TEMPLATE_ID));
  for (const value of [undefined, null, "", "vaporwave", 7, {}]) {
    assert.equal(resolveInvitationTemplateId(value), DEFAULT_INVITATION_TEMPLATE_ID);
  }
});

test("a bogus template string must not fail the whole design parse", () => {
  // If template were an enum, one bad value would blank every other field on
  // the public page (the renderer safeParses the doc as a whole).
  const parsed = invitationDesignFieldsSchema.safeParse({
    template: "not-a-real-template",
    groomName: "김민준",
  });
  assert.ok(parsed.success);
  assert.equal(parsed.success && parsed.data.groomName, "김민준");
});

test("one invalid field value drops alone; siblings survive", () => {
  // Per-field leniency: a wholesale parse failure would blank the public page
  // AND hand the editor an empty form whose save destroys the surviving data.
  const parsed = invitationDesignFieldsSchema.safeParse({
    template: 7, // non-string
    dateTime: "not-a-date",
    heroImageKey: "https://evil.example/photo.jpg", // pre-asset-key URL shape
    groomName: "김민준",
    brideName: "이민지",
  });
  assert.ok(parsed.success);
  if (parsed.success) {
    assert.equal(parsed.data.template, undefined);
    assert.equal(parsed.data.dateTime, undefined);
    assert.equal(parsed.data.heroImageKey, undefined);
    assert.equal(parsed.data.groomName, "김민준");
    assert.equal(parsed.data.brideName, "이민지");
  }
});

test("offset ISO ceremony datetimes are accepted", () => {
  const parsed = invitationDesignFieldsSchema.safeParse({
    dateTime: "2026-10-24T13:00:00+09:00",
  });
  assert.ok(parsed.success);
  assert.equal(parsed.success && parsed.data.dateTime, "2026-10-24T13:00:00+09:00");
});
