import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

/**
 * Locale-aware navigation APIs. Use these instead of `next/link` /
 * `next/navigation` for any path-based navigation so the active locale prefix
 * is preserved. `notFound`, `useSearchParams`, `useParams` are locale-agnostic
 * and should still be imported from `next/navigation`.
 */
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
