import { Noto_Sans_KR, Noto_Serif_KR, Playfair_Display } from "next/font/google";

/**
 * Fonts for invitation templates, self-hosted at build time via next/font.
 * The (invitation) root layout is deliberately bare, so each template applies
 * the variables it needs on its own root element. Note: because the template
 * registry imports every template statically, all three families ship on
 * every invitation page today — per-template code-splitting is a later
 * optimization if it matters. Latin glyphs resolve from the display face
 * first, Korean text falls through to the KR face per glyph, so a stack like
 * `var(--font-display), var(--font-serif-kr), serif` works for mixed text.
 */

/** High-contrast display serif used for names, dates, and headings. */
export const displaySerif = Playfair_Display({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
});

/** Korean serif for body text and any Korean glyphs inside display text. */
export const serifKr = Noto_Serif_KR({
  weight: ["400", "500", "600"],
  subsets: ["latin"],
  variable: "--font-serif-kr",
  display: "swap",
});

/** Korean sans for the minimal template's utilitarian body copy. */
export const sansKr = Noto_Sans_KR({
  weight: ["400", "500", "700"],
  subsets: ["latin"],
  variable: "--font-sans-kr",
  display: "swap",
});
