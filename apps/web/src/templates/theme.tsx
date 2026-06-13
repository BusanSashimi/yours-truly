import type { CSSProperties, ReactNode } from "react";
import { fontVariables } from "./fonts";
import styles from "./theme.module.scss";

/** Hero presentation a template chooses for its opening. */
export type HeroVariant =
  | "full-bleed" // photo fills the viewport, text overlaid
  | "polaroid" // photo in a white card with a caption
  | "letter" // text-only "opened letter", no top photo
  | "arch" // photo under a floral/structural arch, fades into the page
  | "wreath" // illustrated wreath frames the names, no top photo
  | "monogram"; // photo with a small serif monogram over a color wash

export type GalleryLayout = "grid" | "carousel";
export type ButtonShape = "outline" | "solid" | "pill";

/**
 * A template's visual identity. Every section reads these as CSS variables
 * (`var(--ink)`, `var(--accent)`, `var(--font-display)`…) injected by
 * <TemplateShell>, so one set of section components themes 12 different ways.
 */
export type Theme = {
  tokens: {
    /** Page background. */
    bg: string;
    /** Raised surfaces (cards). */
    surface: string;
    /** Primary text. */
    ink: string;
    /** Secondary text. */
    muted: string;
    /** Brand accent (eyebrows, links, highlights). */
    accent: string;
    /** Soft accent fill (button fills, pills). */
    accentSoft: string;
    /** Hairline rules and borders. */
    hairline: string;
    /** Text/icon color on top of `accent`/dark fills. */
    onAccent: string;
  };
  fonts: {
    /** Display font-family stack (headings, names). */
    display: string;
    /** Body font-family stack. */
    body: string;
    /** Cursive script stack (decorative overlays). */
    script: string;
  };
  hero: HeroVariant;
  gallery: GalleryLayout;
  /** Render small eyebrow labels in letterspaced uppercase. */
  eyebrowCaps: boolean;
  buttonShape: ButtonShape;
};

function themeStyle(theme: Theme): CSSProperties {
  return {
    "--bg": theme.tokens.bg,
    "--surface": theme.tokens.surface,
    "--ink": theme.tokens.ink,
    "--muted": theme.tokens.muted,
    "--accent": theme.tokens.accent,
    "--accent-soft": theme.tokens.accentSoft,
    "--hairline": theme.tokens.hairline,
    "--on-accent": theme.tokens.onAccent,
    "--font-display": theme.fonts.display,
    "--font-body": theme.fonts.body,
    "--font-script": theme.fonts.script,
    "--eyebrow-transform": theme.eyebrowCaps ? "uppercase" : "none",
    "--eyebrow-spacing": theme.eyebrowCaps ? "0.28em" : "0.04em",
  } as CSSProperties;
}

/**
 * Root of every invitation template: owns the page, injects the theme tokens
 * as CSS variables and the font-variable classNames, and applies the base
 * background/ink/body-font. Sections compose inside it.
 */
export function TemplateShell({ theme, children }: { theme: Theme; children: ReactNode }) {
  return (
    <main className={`${styles.shell} ${fontVariables}`} style={themeStyle(theme)}>
      {children}
    </main>
  );
}

/** Centered reading column for non-full-bleed sections. */
export function Container({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`${styles.container} ${className ?? ""}`}>{children}</div>;
}

/** Gold/accent small-caps eyebrow label used above section titles. */
export function Eyebrow({ children }: { children: ReactNode }) {
  return <p className={styles.eyebrow}>{children}</p>;
}

/** Serif display section title. */
export function SectionTitle({ children }: { children: ReactNode }) {
  return <h2 className={styles.sectionTitle}>{children}</h2>;
}
