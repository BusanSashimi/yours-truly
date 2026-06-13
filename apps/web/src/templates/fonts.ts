import { Noto_Sans_KR, Noto_Serif_KR, Pinyon_Script, Playfair_Display } from "next/font/google";

/**
 * Fonts for invitation templates, self-hosted at build time via next/font.
 * The (invitation) root layout is bare; the template's <TemplateShell> applies
 * `fontVariables` to its root so every family's CSS variable is defined, then a
 * Theme picks which family each role uses via `--font-display/-body/-script`.
 * Latin glyphs resolve from the Latin face first, Korean falls through to the
 * KR face per glyph, so a stack like
 * `var(--font-display-serif), var(--font-serif-kr), serif` handles mixed text.
 */

/** High-contrast display serif (names, dates, headings). */
export const displaySerif = Playfair_Display({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-display-serif",
  display: "swap",
});

/** Korean serif for body text and Korean glyphs inside display text. */
export const serifKr = Noto_Serif_KR({
  weight: ["400", "500", "600"],
  subsets: ["latin"],
  variable: "--font-serif-kr",
  display: "swap",
});

/** Korean sans for utilitarian body copy and labels. */
export const sansKr = Noto_Sans_KR({
  weight: ["300", "400", "500", "700"],
  subsets: ["latin"],
  variable: "--font-sans-kr",
  display: "swap",
});

/** Cursive script for decorative Latin overlays ("Happy wedding day"). */
export const scriptAccent = Pinyon_Script({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-script",
  display: "swap",
});

/** All font-variable classNames — applied together on each template's root. */
export const fontVariables = [
  displaySerif.variable,
  serifKr.variable,
  sansKr.variable,
  scriptAccent.variable,
].join(" ");

/**
 * Ready-made font-family stacks themes can assign to `--font-display/-body`.
 * Each pairs a Latin face with Noto Serif/Sans KR so Korean always renders.
 */
export const FONT_STACKS = {
  displaySerif: "var(--font-display-serif), var(--font-serif-kr), serif",
  serifKr: "var(--font-serif-kr), serif",
  sansKr: "var(--font-sans-kr), sans-serif",
  script: "var(--font-script), cursive",
} as const;
