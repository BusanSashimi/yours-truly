import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

/**
 * Request-scoped config consumed by next-intl on the server. Resolves the
 * locale from the `[locale]` segment (falling back to the default for unknown
 * values) and loads that locale's message catalog.
 */
export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = routing.locales.includes(requested as Locale)
    ? (requested as Locale)
    : routing.defaultLocale;

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});

type Locale = (typeof routing.locales)[number];
