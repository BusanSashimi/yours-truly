/**
 * Shared contracts used by both the web app and the API.
 *
 * Define a zod schema once here and import it on both sides:
 *   - the API validates requests/responses against it
 *   - the web app derives form types and fetch-response types from it
 * so the wire contract can never silently drift.
 */
import { z } from "zod";

/** A user as exposed to clients — never includes secrets (password hash, etc.). */
export const userSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().min(1).max(120),
  createdAt: z.string().datetime(),
});
export type User = z.infer<typeof userSchema>;

/** POST /api/auth/register */
export const registerInputSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(120),
  password: z.string().min(8).max(200),
});
export type RegisterInput = z.infer<typeof registerInputSchema>;

/** POST /api/auth/login */
export const loginInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
export type LoginInput = z.infer<typeof loginInputSchema>;

/** Successful auth response (register / login / me). */
export const authResponseSchema = z.object({
  user: userSchema,
});
export type AuthResponse = z.infer<typeof authResponseSchema>;

/** Standard error envelope returned by the API. */
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
export const invitationDesignFieldsSchema = z
  .object({
    groomName: z.string(),
    brideName: z.string(),
    /** ISO datetime of the ceremony. */
    dateTime: z.string().datetime(),
    venueName: z.string(),
    venueAddress: z.string(),
    /** 모시는 글 — the invitation message shown to guests. */
    message: z.string(),
  })
  .partial();
export type InvitationDesignFields = z.infer<typeof invitationDesignFieldsSchema>;
