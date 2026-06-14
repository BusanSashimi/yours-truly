import { defineRouting } from "next-intl/routing";

/**
 * Locale routing config shared by the middleware, the request config, and the
 * navigation helpers. English is the default and serves from unprefixed URLs
 * (`/`, `/dashboard`); other locales are prefixed (`/ko/...`, `/ja/...`) via
 * `localePrefix: 'as-needed'`. `localeDetection` defaults to true, so a first
 * visit is routed by the Accept-Language header and remembered in a cookie.
 */
export const routing = defineRouting({
  locales: ["en", "ko", "ja"],
  defaultLocale: "en",
  localePrefix: "as-needed",
});

export type Locale = (typeof routing.locales)[number];
