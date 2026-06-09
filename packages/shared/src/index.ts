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
