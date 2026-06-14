import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  // Run on every path EXCEPT:
  // - /api/*        — proxied to the backend (and better-auth lives here)
  // - /_next/*      — Next internals
  // - anything with a dot (favicon.ico, images, fonts, etc.)
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
