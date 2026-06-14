import type { routing } from "@/i18n/routing";
import type messages from "../messages/en.json";

/**
 * Type-safe next-intl: `en.json` is the source of truth for message keys, so
 * `t("…")` calls are autocompleted and typo'd/missing keys are compile errors.
 */
declare module "next-intl" {
  interface AppConfig {
    Locale: (typeof routing.locales)[number];
    Messages: typeof messages;
  }
}
