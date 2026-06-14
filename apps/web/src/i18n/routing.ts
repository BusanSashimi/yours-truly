import { defineRouting } from "next-intl/routing";

/**
 * Locale routing config shared by the middleware, the request config, and the
 * navigation helpers. Every path carries a locale prefix (`/en/…`, `/ko/…`,
 * `/ja/…`); unprefixed paths redirect to the detected locale. `localeDetection`
 * defaults to true, so `/` is routed by the Accept-Language header and the
 * choice is remembered in a cookie.
 *
 * NOTE: `localePrefix: 'always'` is deliberate (not `'as-needed'`). `'as-needed'`
 * serves the default locale via an internal middleware *rewrite* to `/en`;
 * behind our TLS-terminating nginx (`X-Forwarded-Proto: https`, plaintext http
 * upstream) Next built that rewrite as `https://localhost:3000/en` and tried to
 * proxy https→:3000 → EPROTO → 500 on every unprefixed path in production.
 * `'always'` redirects instead of rewriting, avoiding the internal proxy.
 */
export const routing = defineRouting({
  locales: ["en", "ko", "ja"],
  defaultLocale: "en",
  localePrefix: "always",
});

export type Locale = (typeof routing.locales)[number];
