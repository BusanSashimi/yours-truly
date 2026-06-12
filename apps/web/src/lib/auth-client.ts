import { createAuthClient } from "better-auth/react";

/**
 * Better Auth browser client. Zero config on purpose: it targets the current
 * origin with the default /api/auth base path — dev reaches the API through
 * the next.config rewrite, prod through nginx.
 */
export const authClient = createAuthClient();
