/**
 * Shared contracts used by both the web app and the API.
 *
 * Define a zod schema once here and import it on both sides:
 *   - the API validates requests/responses against it
 *   - the web app derives form types and fetch-response types from it
 * so the wire contract can never silently drift.
 */
import { z } from "zod";

// Auth endpoints (sign-up/sign-in/sign-out/get-session, Naver OAuth) are owned
// by Better Auth under /api/auth — their request/response contracts come from
// the better-auth client, not from this package.

/** Standard error envelope returned by the API (non-auth routes). */
export const apiErrorSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
  }),
});
export type ApiError = z.infer<typeof apiErrorSchema>;

/** GET /api/health */
export const healthSchema = z.object({
  status: z.literal("ok"),
  uptime: z.number(),
});
export type Health = z.infer<typeof healthSchema>;

/** Invitation lifecycle. Drafts are only visible to their owner. */
export const INVITATION_STATUSES = ["draft", "published"] as const;
export const invitationStatusSchema = z.enum(INVITATION_STATUSES);
export type InvitationStatus = z.infer<typeof invitationStatusSchema>;

/**
 * Slugs users may never claim: names the app needs (or will plausibly need)
 * under /invitations/*, plus brand/impersonation-prone names. Every entry must
 * itself satisfy the slug shape rules (lowercase, 3–63 chars) or it is dead
 * weight — enforced by a test in slug.test.ts.
 */
export const RESERVED_SLUGS = new Set([
  // current-or-future app routes under /invitations/
  "new",
  "edit",
  "create",
  "delete",
  "preview",
  "draft",
  "drafts",
  "manage",
  "list",
  "search",
  // infrastructure & app namespace
  "api",
  "www",
  "admin",
  "app",
  "auth",
  "login",
  "logout",
  "register",
  "signup",
  "account",
  "settings",
  "dashboard",
  "static",
  "assets",
  "public",
  "health",
  "status",
  // brand & impersonation
  "yourstruly",
  "yours-truly",
  "official",
  "support",
  "help",
  "info",
  "contact",
  // misc abuse-prone
  "about",
  "terms",
  "privacy",
  "test",
  "demo",
  "example",
  "null",
  "undefined",
  "root",
]);

/**
 * The user-chosen path segment of a public invitation URL
 * (https://www.yourstruly.it/invitations/<slug>).
 *
 * Strictly lowercase — normalize in the UI before submitting; the API does not
 * case-fold, and the DB uniqueness constraint relies on this canonical form.
 */
export const slugSchema = z
  .string()
  .min(3, "Must be at least 3 characters")
  .max(63, "Must be at most 63 characters")
  .regex(
    /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/,
    "Use lowercase letters, numbers, and hyphens; start and end with a letter or number",
  )
  .refine((slug) => !RESERVED_SLUGS.has(slug), "This name is reserved");

/**
 * Built-in design templates. The chosen id lives in the design doc
 * (`design.template`) — the design doc is already the per-invitation,
 * leniently-parsed bag of renderer inputs, so no schema migration is needed
 * and documents predating templates keep rendering via the default.
 */
export const INVITATION_TEMPLATE_IDS = [
  "ivory-editorial",
  "periwinkle-story",
  "warm-rose-film",
  "save-the-date-editorial",
  "cobalt-italic-ivory",
  "greenery-arch",
  "terracotta-serif",
  "letter-seal",
  "eucalyptus-wreath",
  "sage-editorial",
  "sage-storybook",
  "mocha-editorial",
] as const;
export type InvitationTemplateId = (typeof INVITATION_TEMPLATE_IDS)[number];
export const DEFAULT_INVITATION_TEMPLATE_ID: InvitationTemplateId = "ivory-editorial";

/** Missing/unknown template values resolve to the default, never an error. */
export function resolveInvitationTemplateId(value: unknown): InvitationTemplateId {
  return INVITATION_TEMPLATE_IDS.includes(value as InvitationTemplateId)
    ? (value as InvitationTemplateId)
    : DEFAULT_INVITATION_TEMPLATE_ID;
}

/**
 * The invitation's design document. Stored opaquely for now; a versioned
 * structured format will be defined alongside the editor.
 */
export const invitationDesignSchema = z.record(z.unknown());
export type InvitationDesign = z.infer<typeof invitationDesignSchema>;

/**
 * An invitation as exposed to clients. The owner id is intentionally absent:
 * owners only ever see their own, and guests must not see it at all. `slug` is
 * a plain string on output — already-stored slugs must keep serializing even
 * if RESERVED_SLUGS later grows to cover one of them.
 */
export const invitationSchema = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  status: invitationStatusSchema,
  design: invitationDesignSchema,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Invitation = z.infer<typeof invitationSchema>;

/** POST /api/invitations */
export const createInvitationInputSchema = z.object({
  slug: slugSchema,
  design: invitationDesignSchema.optional(),
});
export type CreateInvitationInput = z.infer<typeof createInvitationInputSchema>;

/** PATCH /api/invitations/:id — any subset of fields, but not an empty patch. */
export const updateInvitationInputSchema = z
  .object({
    slug: slugSchema,
    status: invitationStatusSchema,
    design: invitationDesignSchema,
  })
  .partial()
  .refine((patch) => Object.keys(patch).length > 0, "Provide at least one field to update");
export type UpdateInvitationInput = z.infer<typeof updateInvitationInputSchema>;

/** Single-invitation responses (create / get / update). */
export const invitationResponseSchema = z.object({
  invitation: invitationSchema,
});
export type InvitationResponse = z.infer<typeof invitationResponseSchema>;

/** GET /api/invitations */
export const invitationListResponseSchema = z.object({
  invitations: z.array(invitationSchema),
});
export type InvitationListResponse = z.infer<typeof invitationListResponseSchema>;

/**
 * The design-document fields the public renderer currently understands.
 * Deliberately lenient: everything optional, unknown keys ignored — the full
 * versioned design format will be defined alongside the editor, and an older
 * or richer document must never break a published page.
 */
/**
 * Shape of an uploaded asset's S3 object key: i/<invitationId>/<uuid>.<ext>.
 * Renderers additionally require the invitationId segment to match the
 * invitation being rendered.
 */
export const ASSET_KEY_REGEX =
  /^i\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp)$/;

/**
 * Guest-uploaded media (게스트스냅) lives under a separate `g/<invitationId>/`
 * prefix, distinct from the couple's own `i/` assets: guest uploads are
 * dynamic, listed via an API endpoint, and never written into the design doc.
 */
export const GUEST_ASSET_KEY_REGEX =
  /^g\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp)$/;

/** A couple's own asset key (used for hero, gallery, profile, timeline photos). */
const assetKey = z.string().regex(ASSET_KEY_REGEX);

// --- Rich design-doc sub-schemas (all leaves optional; whole sub-objects drop
// via the top-level `.catch(undefined)` if malformed, so one bad value never
// blanks the rest of the page). ---

/** One side of the couple, for profile cards (신랑/신부 소개). */
export const personProfileSchema = z.object({
  photoKey: assetKey.optional(),
  /** Free text — "1990" or "1990년생 서울". */
  birth: z.string().optional(),
  region: z.string().optional(),
  mbti: z.string().optional(),
  /** Short role/tag line (e.g. "다정한 사랑꾼"). */
  role: z.string().optional(),
  traits: z.array(z.string()).optional(),
  bio: z.string().optional(),
});

export const profilesSchema = z.object({
  groom: personProfileSchema.optional(),
  bride: personProfileSchema.optional(),
});

/** A parent in the 혼주 line; `deceased` renders the 故 marker. */
export const parentSchema = z.object({
  name: z.string().optional(),
  deceased: z.boolean().optional(),
  phone: z.string().optional(),
});

export const parentsSchema = z.object({
  groomFather: parentSchema.optional(),
  groomMother: parentSchema.optional(),
  brideFather: parentSchema.optional(),
  brideMother: parentSchema.optional(),
});

/** A labelled phone contact (연락처): label like "신랑", "신랑 어머니". */
export const contactSchema = z.object({
  label: z.string(),
  name: z.string().optional(),
  phone: z.string(),
});

/** A milestone on the relationship timeline (우리의 시간 / 히스토리). */
export const timelineEntrySchema = z.object({
  date: z.string().optional(),
  label: z.string().optional(),
  text: z.string().optional(),
  imageKey: assetKey.optional(),
});

/** A wedding-interview question (웨딩 인터뷰), with per-person answers. */
export const interviewEntrySchema = z.object({
  question: z.string(),
  groomAnswer: z.string().optional(),
  brideAnswer: z.string().optional(),
});

/** Map + navigation deep links for the venue (오시는 길). */
export const mapSchema = z.object({
  lat: z.number().optional(),
  lng: z.number().optional(),
  placeId: z.string().optional(),
  naverUrl: z.string().url().optional(),
  kakaoUrl: z.string().url().optional(),
  tmapUrl: z.string().url().optional(),
});

/** Free-text transport directions (교통편 안내). */
export const transitSchema = z.object({
  bus: z.string().optional(),
  subway: z.string().optional(),
  car: z.string().optional(),
  parking: z.string().optional(),
  shuttle: z.string().optional(),
});

/** Reception/after-party block (피로연 안내), often a separate place/time. */
export const receptionSchema = z.object({
  dateTime: z.string().optional(),
  venue: z.string().optional(),
  address: z.string().optional(),
  note: z.string().optional(),
});

/** A gift/account entry (마음 전하실 곳 / 계좌). */
export const accountSchema = z.object({
  side: z.enum(["groom", "bride"]).optional(),
  relation: z.string().optional(),
  bank: z.string().optional(),
  number: z.string().optional(),
  holder: z.string().optional(),
  kakaoPayUrl: z.string().url().optional(),
});

/** A single tabbed info panel (포토부스 / 주차안내 / 답례품). */
export const infoTabSchema = z.object({
  text: z.string().optional(),
  imageKey: assetKey.optional(),
});

export const infoTabsSchema = z.object({
  photobooth: infoTabSchema.optional(),
  parking: infoTabSchema.optional(),
  favor: infoTabSchema.optional(),
});

/** Guest photo-upload settings (게스트스냅); the media itself lives in a table. */
export const guestUploadSettingsSchema = z.object({
  enabled: z.boolean().optional(),
  /** Upload opens at this instant; before it, the section shows a countdown. */
  openDate: z.string().datetime({ offset: true }).optional(),
  prompt: z.string().optional(),
});

/** Decorative epigraph/quote (e.g. a poem excerpt) shown near the top. */
export const quoteSchema = z.object({
  text: z.string().optional(),
  source: z.string().optional(),
});

// Every field is `.optional().catch(undefined)` rather than the object being
// `.partial()`: leniency must be per-field. With a plain partial object, ONE
// invalid stored value (a non-string template, an offset-less legacy date, a
// pre-asset-key URL) fails the whole safeParse — blanking every other field on
// the public page and handing the editor an empty form whose save would then
// destroy the surviving data. With catch, only the bad value drops.
export const invitationDesignFieldsSchema = z.object({
  /**
   * Design template id. Deliberately a plain string, not an enum: renderers
   * map unrecognized values through resolveInvitationTemplateId instead of
   * rejecting them.
   */
  template: z.string().optional().catch(undefined),
  groomName: z.string().optional().catch(undefined),
  brideName: z.string().optional().catch(undefined),
  /** ISO datetime of the ceremony (UTC or offset form). */
  dateTime: z.string().datetime({ offset: true }).optional().catch(undefined),
  venueName: z.string().optional().catch(undefined),
  venueAddress: z.string().optional().catch(undefined),
  /** 모시는 글 — the invitation message shown to guests. */
  message: z.string().optional().catch(undefined),
  /**
   * Hero photo as an S3 object KEY (i/<invitationId>/<uuid>.<ext>), never a
   * URL: renderers derive the URL from their configured asset origin and
   * refuse keys outside the invitation's own prefix — arbitrary hosts and
   * other couples' photos can't be smuggled in, and a CDN cutover later is
   * config, not a data migration.
   */
  heroImageKey: z.string().regex(ASSET_KEY_REGEX).optional().catch(undefined),

  // --- Rich sections (full-parity designs). Each is independently lenient. ---
  /** Decorative epigraph/quote near the top. */
  quote: quoteSchema.optional().catch(undefined),
  /** Photo gallery (갤러리). */
  galleryImageKeys: z.array(assetKey).optional().catch(undefined),
  /** Full-bleed closing photo(s) behind the farewell message. */
  closingImageKeys: z.array(assetKey).optional().catch(undefined),
  /** Couple profile cards (신랑/신부 소개). */
  profiles: profilesSchema.optional().catch(undefined),
  /** 혼주 line (parents, with 故 markers). */
  parents: parentsSchema.optional().catch(undefined),
  /** Phone contacts (연락처) for the 혼주에게 연락하기 sheet. */
  contacts: z.array(contactSchema).optional().catch(undefined),
  /** Relationship timeline (우리의 시간 / 히스토리). */
  timeline: z.array(timelineEntrySchema).optional().catch(undefined),
  /** Anchor date for the 함께한 시간 elapsed counter (ISO; distinct from dateTime). */
  relationshipStartDate: z.string().datetime({ offset: true }).optional().catch(undefined),
  /** Wedding interview Q&A (웨딩 인터뷰). */
  interview: z.array(interviewEntrySchema).optional().catch(undefined),
  /** Venue map + nav deep links (오시는 길). */
  map: mapSchema.optional().catch(undefined),
  /** Transport directions (교통편 안내). */
  transit: transitSchema.optional().catch(undefined),
  /** Reception / after-party block (피로연 안내). */
  reception: receptionSchema.optional().catch(undefined),
  /** Gift/account info (마음 전하실 곳 / 계좌). */
  accounts: z.array(accountSchema).optional().catch(undefined),
  /** Tabbed extras (포토부스 / 주차안내 / 답례품). */
  tabs: infoTabsSchema.optional().catch(undefined),
  /** External wreath-gift link (축하화환 보내기). */
  wreathUrl: z.string().url().optional().catch(undefined),
  /** Guest photo-upload feature settings (게스트스냅). */
  guestUpload: guestUploadSettingsSchema.optional().catch(undefined),
  /** Toggle the RSVP section (참석 여부 전달). */
  rsvpEnabled: z.boolean().optional().catch(undefined),
  /** Toggle the guestbook section (방명록). */
  guestbookEnabled: z.boolean().optional().catch(undefined),
  /** Section ids the couple has hidden, and an optional custom order. */
  hiddenSections: z.array(z.string()).optional().catch(undefined),
  sectionOrder: z.array(z.string()).optional().catch(undefined),
});
export type InvitationDesignFields = z.infer<typeof invitationDesignFieldsSchema>;

/** Image uploads (hero photo etc.) — presigned direct-to-S3 PUT. */
export const UPLOAD_CONTENT_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const UPLOAD_MAX_BYTES = 10 * 1024 * 1024;

/** POST /api/uploads */
export const createUploadInputSchema = z.object({
  invitationId: z.string().uuid(),
  contentType: z.enum(UPLOAD_CONTENT_TYPES),
  size: z
    .number()
    .int()
    .positive()
    .max(UPLOAD_MAX_BYTES, "이미지는 10MB 이하여야 합니다"),
});
export type CreateUploadInput = z.infer<typeof createUploadInputSchema>;

export const createUploadResponseSchema = z.object({
  /** Presigned PUT URL — upload the file here with the same Content-Type. */
  uploadUrl: z.string().url(),
  /** Public URL to store in the design doc once the PUT succeeds. */
  publicUrl: z.string().url(),
  key: z.string(),
});
export type CreateUploadResponse = z.infer<typeof createUploadResponseSchema>;

// ============================================================================
// Dynamic guest-facing features (own tables, public-write endpoints).
// Guests submit without an account, so inputs are tightly bounded; owner-only
// reads/moderation reuse the session auth on the API side.
// ============================================================================

/** RSVP — 참석 여부 전달. */
export const RSVP_ATTENDANCE = ["yes", "no"] as const;
export const RSVP_SIDE = ["groom", "bride"] as const;
export const RSVP_MEAL = ["yes", "no", "undecided"] as const;
export const rsvpAttendanceSchema = z.enum(RSVP_ATTENDANCE);
export const rsvpSideSchema = z.enum(RSVP_SIDE);

/** POST /api/invitations/:id/rsvp (public). */
export const createRsvpInputSchema = z.object({
  name: z.string().trim().min(1).max(40),
  attendance: rsvpAttendanceSchema,
  side: rsvpSideSchema.optional(),
  headcount: z.number().int().min(1).max(50).optional(),
  meal: z.enum(RSVP_MEAL).optional(),
  phone: z.string().trim().max(20).optional(),
  message: z.string().trim().max(500).optional(),
});
export type CreateRsvpInput = z.infer<typeof createRsvpInputSchema>;

/** A stored RSVP as returned to the owner (GET, auth required). */
export const rsvpEntrySchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  attendance: rsvpAttendanceSchema,
  side: rsvpSideSchema.nullable(),
  headcount: z.number().int().nullable(),
  meal: z.enum(RSVP_MEAL).nullable(),
  phone: z.string().nullable(),
  message: z.string().nullable(),
  createdAt: z.string().datetime(),
});
export type RsvpEntry = z.infer<typeof rsvpEntrySchema>;

export const rsvpListResponseSchema = z.object({
  responses: z.array(rsvpEntrySchema),
  counts: z.object({
    attending: z.number().int(),
    declined: z.number().int(),
    guests: z.number().int(),
  }),
});
export type RsvpListResponse = z.infer<typeof rsvpListResponseSchema>;

/** Guestbook — 방명록. Public read + write; optional 4-digit PIN for self-delete. */
export const guestbookPinSchema = z.string().regex(/^\d{4}$/, "PIN은 숫자 4자리입니다");

/** POST /api/invitations/:id/guestbook (public). */
export const createGuestbookInputSchema = z.object({
  name: z.string().trim().min(1).max(40),
  message: z.string().trim().min(1).max(1000),
  /** Optional PIN that lets the author delete their own entry later. */
  pin: guestbookPinSchema.optional(),
});
export type CreateGuestbookInput = z.infer<typeof createGuestbookInputSchema>;

/** A guestbook entry as shown publicly (PIN/hash never serialized). */
export const guestbookEntrySchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  message: z.string(),
  createdAt: z.string().datetime(),
});
export type GuestbookEntry = z.infer<typeof guestbookEntrySchema>;

export const guestbookListResponseSchema = z.object({
  entries: z.array(guestbookEntrySchema),
  total: z.number().int(),
});
export type GuestbookListResponse = z.infer<typeof guestbookListResponseSchema>;

/** DELETE /api/invitations/:id/guestbook/:entryId — author self-delete with PIN. */
export const deleteGuestbookInputSchema = z.object({ pin: guestbookPinSchema });
export type DeleteGuestbookInput = z.infer<typeof deleteGuestbookInputSchema>;

/** Guest media upload — 게스트스냅. Public, gated by guestUpload.openDate. */
export const GUEST_UPLOAD_CONTENT_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const GUEST_UPLOAD_MAX_BYTES = 15 * 1024 * 1024;

/** POST /api/invitations/:id/guest-uploads (public, presign). */
export const createGuestUploadInputSchema = z.object({
  uploaderName: z.string().trim().max(40).optional(),
  contentType: z.enum(GUEST_UPLOAD_CONTENT_TYPES),
  size: z.number().int().positive().max(GUEST_UPLOAD_MAX_BYTES, "파일은 15MB 이하여야 합니다"),
});
export type CreateGuestUploadInput = z.infer<typeof createGuestUploadInputSchema>;

export const createGuestUploadResponseSchema = z.object({
  uploadUrl: z.string().url(),
  /** Guest-asset key (g/<invitationId>/<uuid>.<ext>); confirm after the PUT. */
  key: z.string(),
});
export type CreateGuestUploadResponse = z.infer<typeof createGuestUploadResponseSchema>;

/** POST .../guest-uploads/confirm — record a completed upload. */
export const confirmGuestUploadInputSchema = z.object({
  key: z.string().regex(GUEST_ASSET_KEY_REGEX),
  uploaderName: z.string().trim().max(40).optional(),
});
export type ConfirmGuestUploadInput = z.infer<typeof confirmGuestUploadInputSchema>;

export const guestUploadEntrySchema = z.object({
  id: z.string().uuid(),
  key: z.string(),
  uploaderName: z.string().nullable(),
  createdAt: z.string().datetime(),
});
export type GuestUploadEntry = z.infer<typeof guestUploadEntrySchema>;

export const guestUploadListResponseSchema = z.object({
  uploads: z.array(guestUploadEntrySchema),
});
export type GuestUploadListResponse = z.infer<typeof guestUploadListResponseSchema>;
