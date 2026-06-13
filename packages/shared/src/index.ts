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
export const INVITATION_TEMPLATE_IDS = ["classic", "modern", "romantic", "minimal"] as const;
export type InvitationTemplateId = (typeof INVITATION_TEMPLATE_IDS)[number];
export const DEFAULT_INVITATION_TEMPLATE_ID: InvitationTemplateId = "classic";

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
