import Image from "next/image";
import type { InvitationDesignFields } from "@yours-truly/shared";
import { assetUrl } from "@/lib/assets";
import { Eyebrow } from "../theme";
import type { HeroVariant } from "../theme";
import { formatDate, formatDateNumeric } from "../format";
import styles from "./Hero.module.scss";

type HeroProps = {
  variant: HeroVariant;
  heroKey?: string;
  groomName?: string;
  brideName?: string;
  dateTime?: string;
  scriptLine?: string;
  quote?: InvitationDesignFields["quote"];
  /** Stamp a wax seal (with the numeric date) on the "letter" hero. */
  seal?: boolean;
};

const FALLBACK_HEADING = "저희 결혼합니다";

/**
 * A watercolor eucalyptus sprig-wreath framing the "wreath" hero: twelve leaf
 * sprigs ring an open center over a soft radial foliage wash, so the names
 * stay legible on top. Tinted via `currentColor` (the theme accent) with a
 * secondary muted-sage tone on two sprigs for hand-painted silver-green depth.
 */
function EucalyptusWreath() {
  return (
    <svg className={styles.wreathArt} viewBox="0 0 200 200" aria-hidden focusable="false">
      <defs>
        <filter id="wc_sprigs_blur" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2.4" />
        </filter>
        <filter id="wc_sprigs_soft" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="0.7" />
        </filter>
        <radialGradient id="wc_sprigs_wash" cx="50%" cy="50%" r="50%" gradientUnits="objectBoundingBox">
          <stop offset="55%" stopColor="currentColor" stopOpacity="0" />
          <stop offset="78%" stopColor="currentColor" stopOpacity="0.22" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.05" />
        </radialGradient>
      </defs>

      <circle cx="100" cy="100" r="86" fill="url(#wc_sprigs_wash)" />
      <g filter="url(#wc_sprigs_blur)" fill="currentColor" opacity="0.16">
        <path d="M100 22 C140 26 172 56 176 100 C172 146 140 176 100 178 C58 176 26 144 24 100 C28 56 60 26 100 22 Z M100 44 C70 46 48 70 46 100 C48 132 70 152 100 156 C132 152 152 130 154 100 C152 70 130 48 100 44 Z" />
        <ellipse cx="100" cy="156" rx="46" ry="20" opacity="0.6" />
        <ellipse cx="150" cy="62" rx="22" ry="26" opacity="0.5" />
      </g>

      <g fill="currentColor" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" filter="url(#wc_sprigs_soft)">

        <g transform="translate(100,30) rotate(0)">
          <path d="M0 0 Q-2 14 1 28" fill="none" strokeWidth="1.1" opacity="0.55" />
          <ellipse cx="-5" cy="6" rx="3.2" ry="6.5" transform="rotate(-38 -5 6)" opacity="0.62" />
          <ellipse cx="6" cy="11" rx="3.4" ry="7" transform="rotate(34 6 11)" opacity="0.5" />
          <ellipse cx="-6" cy="17" rx="3.2" ry="6.8" transform="rotate(-30 -6 17)" opacity="0.6" />
          <ellipse cx="5" cy="23" rx="2.8" ry="6" transform="rotate(28 5 23)" opacity="0.45" />
          <ellipse cx="0" cy="29" rx="2.4" ry="5.4" opacity="0.55" />
        </g>

        <g transform="translate(135,38) rotate(42)">
          <path d="M0 0 Q3 16 -1 32" fill="none" strokeWidth="1.1" opacity="0.6" />
          <ellipse cx="-6" cy="5" rx="3.6" ry="7.4" transform="rotate(-40 -6 5)" opacity="0.66" />
          <ellipse cx="6" cy="9" rx="3.8" ry="7.8" transform="rotate(38 6 9)" opacity="0.55" />
          <ellipse cx="-6" cy="15" rx="3.6" ry="7.6" transform="rotate(-34 -6 15)" opacity="0.7" />
          <ellipse cx="6" cy="21" rx="3.4" ry="7.2" transform="rotate(32 6 21)" opacity="0.52" />
          <ellipse cx="-5" cy="27" rx="3" ry="6.4" transform="rotate(-28 -5 27)" opacity="0.62" />
          <ellipse cx="2" cy="32" rx="2.6" ry="5.6" transform="rotate(20 2 32)" opacity="0.48" />
        </g>

        <g transform="translate(158,58) rotate(74)">
          <path d="M0 0 Q4 18 -1 36" fill="none" strokeWidth="1.2" opacity="0.62" />
          <ellipse cx="-7" cy="6" rx="4" ry="8.2" transform="rotate(-42 -7 6)" opacity="0.68" />
          <ellipse cx="7" cy="11" rx="4.2" ry="8.6" transform="rotate(40 7 11)" opacity="0.56" />
          <ellipse cx="-7" cy="18" rx="4" ry="8.4" transform="rotate(-36 -7 18)" opacity="0.72" />
          <ellipse cx="7" cy="25" rx="3.6" ry="7.8" transform="rotate(34 7 25)" opacity="0.54" />
          <ellipse cx="-6" cy="31" rx="3.2" ry="7" transform="rotate(-30 -6 31)" opacity="0.64" />
          <ellipse cx="2" cy="37" rx="2.8" ry="6" transform="rotate(22 2 37)" opacity="0.5" />
        </g>

        <g transform="translate(170,86) rotate(98)">
          <path d="M0 0 Q4 16 -1 34" fill="none" strokeWidth="1.1" opacity="0.6" />
          <ellipse cx="-6" cy="6" rx="3.8" ry="7.8" transform="rotate(-40 -6 6)" opacity="0.66" />
          <ellipse cx="7" cy="11" rx="4" ry="8.2" transform="rotate(38 7 11)" opacity="0.54" />
          <ellipse cx="-6" cy="18" rx="3.8" ry="8" transform="rotate(-34 -6 18)" opacity="0.7" />
          <ellipse cx="6" cy="24" rx="3.4" ry="7.2" transform="rotate(32 6 24)" opacity="0.52" />
          <ellipse cx="-5" cy="30" rx="3" ry="6.4" transform="rotate(-28 -5 30)" opacity="0.6" />
          <ellipse cx="1" cy="34" rx="2.6" ry="5.6" opacity="0.46" />
        </g>

        <g transform="translate(166,118) rotate(126)" fill="#7d9a7e">
          <path d="M0 0 Q3 15 -1 30" fill="none" stroke="#7d9a7e" strokeWidth="1" opacity="0.5" />
          <ellipse cx="-6" cy="6" rx="3.6" ry="7.4" transform="rotate(-40 -6 6)" opacity="0.5" />
          <ellipse cx="6" cy="11" rx="3.8" ry="7.6" transform="rotate(38 6 11)" opacity="0.42" />
          <ellipse cx="-6" cy="17" rx="3.6" ry="7.4" transform="rotate(-34 -6 17)" opacity="0.52" />
          <ellipse cx="5" cy="23" rx="3.2" ry="6.8" transform="rotate(32 5 23)" opacity="0.4" />
          <ellipse cx="-4" cy="29" rx="2.8" ry="6" transform="rotate(-28 -4 29)" opacity="0.48" />
        </g>

        <g transform="translate(146,150) rotate(152)">
          <path d="M0 0 Q4 18 -1 36" fill="none" strokeWidth="1.2" opacity="0.62" />
          <ellipse cx="-7" cy="6" rx="4" ry="8.2" transform="rotate(-42 -7 6)" opacity="0.68" />
          <ellipse cx="7" cy="12" rx="4.2" ry="8.6" transform="rotate(40 7 12)" opacity="0.56" />
          <ellipse cx="-7" cy="19" rx="4" ry="8.4" transform="rotate(-36 -7 19)" opacity="0.72" />
          <ellipse cx="7" cy="26" rx="3.6" ry="7.8" transform="rotate(34 7 26)" opacity="0.54" />
          <ellipse cx="-6" cy="32" rx="3.2" ry="7" transform="rotate(-30 -6 32)" opacity="0.64" />
          <ellipse cx="2" cy="37" rx="2.8" ry="6" transform="rotate(22 2 37)" opacity="0.5" />
        </g>

        <g transform="translate(112,168) rotate(176)">
          <path d="M0 0 Q3 17 -1 35" fill="none" strokeWidth="1.2" opacity="0.62" />
          <ellipse cx="-7" cy="6" rx="4.2" ry="8.6" transform="rotate(-42 -7 6)" opacity="0.7" />
          <ellipse cx="7" cy="12" rx="4.4" ry="9" transform="rotate(40 7 12)" opacity="0.58" />
          <ellipse cx="-7" cy="19" rx="4.2" ry="8.8" transform="rotate(-36 -7 19)" opacity="0.74" />
          <ellipse cx="7" cy="26" rx="3.8" ry="8" transform="rotate(34 7 26)" opacity="0.56" />
          <ellipse cx="-6" cy="33" rx="3.4" ry="7.2" transform="rotate(-30 -6 33)" opacity="0.66" />
          <ellipse cx="2" cy="38" rx="3" ry="6.2" transform="rotate(22 2 38)" opacity="0.5" />
        </g>

        <g transform="translate(82,168) rotate(202)">
          <path d="M0 0 Q4 17 -1 35" fill="none" strokeWidth="1.2" opacity="0.62" />
          <ellipse cx="-7" cy="6" rx="4.2" ry="8.6" transform="rotate(-42 -7 6)" opacity="0.7" />
          <ellipse cx="7" cy="12" rx="4.4" ry="9" transform="rotate(40 7 12)" opacity="0.58" />
          <ellipse cx="-7" cy="19" rx="4.2" ry="8.8" transform="rotate(-36 -7 19)" opacity="0.74" />
          <ellipse cx="7" cy="26" rx="3.8" ry="8" transform="rotate(34 7 26)" opacity="0.56" />
          <ellipse cx="-6" cy="33" rx="3.4" ry="7.2" transform="rotate(-30 -6 33)" opacity="0.66" />
          <ellipse cx="2" cy="38" rx="3" ry="6.2" transform="rotate(22 2 38)" opacity="0.5" />
        </g>

        <g transform="translate(54,150) rotate(208)" fill="#7d9a7e">
          <path d="M0 0 Q3 15 -1 31" fill="none" stroke="#7d9a7e" strokeWidth="1" opacity="0.48" />
          <ellipse cx="-6" cy="6" rx="3.6" ry="7.4" transform="rotate(-40 -6 6)" opacity="0.5" />
          <ellipse cx="6" cy="11" rx="3.8" ry="7.6" transform="rotate(38 6 11)" opacity="0.42" />
          <ellipse cx="-6" cy="17" rx="3.6" ry="7.4" transform="rotate(-34 -6 17)" opacity="0.52" />
          <ellipse cx="5" cy="23" rx="3.2" ry="6.8" transform="rotate(32 5 23)" opacity="0.4" />
          <ellipse cx="-4" cy="29" rx="2.8" ry="6" transform="rotate(-28 -4 29)" opacity="0.46" />
        </g>

        <g transform="translate(34,114) rotate(236)">
          <path d="M0 0 Q4 16 -1 33" fill="none" strokeWidth="1.1" opacity="0.6" />
          <ellipse cx="-6" cy="6" rx="3.8" ry="7.8" transform="rotate(-40 -6 6)" opacity="0.66" />
          <ellipse cx="7" cy="11" rx="4" ry="8.2" transform="rotate(38 7 11)" opacity="0.54" />
          <ellipse cx="-6" cy="18" rx="3.8" ry="8" transform="rotate(-34 -6 18)" opacity="0.7" />
          <ellipse cx="6" cy="24" rx="3.4" ry="7.2" transform="rotate(32 6 24)" opacity="0.52" />
          <ellipse cx="-5" cy="30" rx="3" ry="6.4" transform="rotate(-28 -5 30)" opacity="0.6" />
          <ellipse cx="1" cy="33" rx="2.6" ry="5.6" opacity="0.46" />
        </g>

        <g transform="translate(34,80) rotate(264)">
          <path d="M0 0 Q3 14 -1 29" fill="none" strokeWidth="1.1" opacity="0.56" />
          <ellipse cx="-5" cy="6" rx="3.4" ry="6.8" transform="rotate(-38 -5 6)" opacity="0.6" />
          <ellipse cx="6" cy="11" rx="3.6" ry="7.2" transform="rotate(36 6 11)" opacity="0.5" />
          <ellipse cx="-6" cy="17" rx="3.4" ry="7" transform="rotate(-32 -6 17)" opacity="0.62" />
          <ellipse cx="5" cy="22" rx="3" ry="6.4" transform="rotate(30 5 22)" opacity="0.46" />
          <ellipse cx="-3" cy="28" rx="2.6" ry="5.6" transform="rotate(-24 -3 28)" opacity="0.54" />
        </g>

        <g transform="translate(56,50) rotate(296)">
          <path d="M0 0 Q4 15 -1 31" fill="none" strokeWidth="1.1" opacity="0.58" />
          <ellipse cx="-6" cy="6" rx="3.6" ry="7.4" transform="rotate(-40 -6 6)" opacity="0.62" />
          <ellipse cx="6" cy="11" rx="3.8" ry="7.6" transform="rotate(38 6 11)" opacity="0.52" />
          <ellipse cx="-6" cy="17" rx="3.6" ry="7.4" transform="rotate(-34 -6 17)" opacity="0.66" />
          <ellipse cx="5" cy="23" rx="3.2" ry="6.8" transform="rotate(32 5 23)" opacity="0.5" />
          <ellipse cx="-4" cy="29" rx="2.8" ry="6" transform="rotate(-28 -4 29)" opacity="0.58" />
        </g>

      </g>
    </svg>
  );
}

/** Names joined with a hairline-spaced separator, or the fallback heading. */
function namesOrFallback(groomName?: string, brideName?: string): string {
  if (!groomName || !brideName) return FALLBACK_HEADING;
  return `${groomName} · ${brideName}`;
}

/** First grapheme of each name, for the monogram wash (e.g. "민 · 지"). */
function monogramOf(groomName?: string, brideName?: string): string | null {
  const g = groomName?.trim().charAt(0);
  const b = brideName?.trim().charAt(0);
  if (!g || !b) return null;
  return `${g} · ${b}`;
}

/**
 * The page-opening hero (메인). Six visually distinct treatments selected by
 * `variant`; every color/font comes from the theme CSS variables injected by
 * <TemplateShell>. Photo variants mirror Gallery's next/image usage; the
 * text-only variants ("letter"/"wreath") ignore `heroKey`. Names degrade to a
 * "저희 결혼합니다" heading when either name is missing. Server component.
 */
export function Hero({
  variant,
  heroKey,
  groomName,
  brideName,
  dateTime,
  scriptLine,
  quote,
  seal,
}: HeroProps) {
  const names = namesOrFallback(groomName, brideName);
  const hasNames = Boolean(groomName && brideName);

  if (variant === "letter") {
    return (
      <section className={`${styles.section} ${styles.letter}`}>
        <div className={styles.letterInner}>
          {scriptLine && <p className={styles.script}>{scriptLine}</p>}
          <h1 className={hasNames ? styles.namesDisplay : styles.fallbackHeading}>{names}</h1>
          {dateTime && (
            <>
              <span className={styles.rule} />
              <p className={styles.dateLong}>{formatDate(dateTime)}</p>
            </>
          )}
          {seal && dateTime && <span className={styles.waxSeal}>{formatDateNumeric(dateTime)}</span>}
          {quote?.text && (
            <figure className={styles.quote}>
              <blockquote>{quote.text}</blockquote>
              {quote.source && <figcaption>{quote.source}</figcaption>}
            </figure>
          )}
        </div>
      </section>
    );
  }

  if (variant === "wreath") {
    return (
      <section className={`${styles.section} ${styles.wreath}`}>
        <div className={styles.wreathFrame}>
          <EucalyptusWreath />
          <div className={styles.wreathInner}>
            {scriptLine && <p className={styles.script}>{scriptLine}</p>}
            <h1 className={hasNames ? styles.namesDisplay : styles.fallbackHeading}>{names}</h1>
            {dateTime && <p className={styles.dateNumeric}>{formatDateNumeric(dateTime)}</p>}
          </div>
        </div>
        {quote?.text && (
          <figure className={styles.quote}>
            <blockquote>{quote.text}</blockquote>
            {quote.source && <figcaption>{quote.source}</figcaption>}
          </figure>
        )}
      </section>
    );
  }

  if (variant === "polaroid") {
    return (
      <section className={`${styles.section} ${styles.polaroid}`}>
        <div className={styles.polaroidCard}>
          {heroKey ? (
            <div className={styles.polaroidPhoto}>
              <Image
                src={assetUrl(heroKey)}
                alt=""
                fill
                sizes="(max-width: 480px) 100vw, 420px"
                className={styles.img}
                priority
              />
            </div>
          ) : null}
          <div className={styles.polaroidCaption}>
            {hasNames && <Eyebrow>The Wedding Of</Eyebrow>}
            <h1 className={hasNames ? styles.namesDisplay : styles.fallbackHeading}>{names}</h1>
            {dateTime && <p className={styles.dateNumeric}>{formatDateNumeric(dateTime)}</p>}
          </div>
        </div>
      </section>
    );
  }

  if (variant === "arch") {
    return (
      <section className={`${styles.section} ${styles.arch}`}>
        <div className={styles.archFrame}>
          {heroKey ? (
            <Image
              src={assetUrl(heroKey)}
              alt=""
              fill
              sizes="(max-width: 480px) 100vw, 480px"
              className={styles.img}
              priority
            />
          ) : (
            <div className={styles.archPlaceholder} />
          )}
          <span className={styles.archFade} />
        </div>
        <div className={styles.archCaption}>
          {scriptLine && <p className={styles.script}>{scriptLine}</p>}
          <h1 className={hasNames ? styles.namesDisplay : styles.fallbackHeading}>{names}</h1>
          {dateTime && <p className={styles.dateNumeric}>{formatDateNumeric(dateTime)}</p>}
        </div>
      </section>
    );
  }

  if (variant === "monogram") {
    const monogram = monogramOf(groomName, brideName);
    return (
      <section className={`${styles.section} ${styles.monogram}`}>
        <div className={styles.monogramPhoto}>
          {heroKey ? (
            <Image
              src={assetUrl(heroKey)}
              alt=""
              fill
              sizes="(max-width: 480px) 100vw, 480px"
              className={styles.img}
              priority
            />
          ) : (
            <div className={styles.monogramPlaceholder} />
          )}
          <span className={styles.monogramWash} />
          {monogram && <span className={styles.monogramMark}>{monogram}</span>}
        </div>
        <div className={styles.monogramCaption}>
          {scriptLine && <p className={styles.script}>{scriptLine}</p>}
          <h1 className={hasNames ? styles.namesDisplay : styles.fallbackHeading}>{names}</h1>
          {dateTime && <p className={styles.dateNumeric}>{formatDateNumeric(dateTime)}</p>}
        </div>
      </section>
    );
  }

  // "full-bleed" (default): photo (or charcoal ground) fills the viewport with
  // a bottom scrim and overlaid white text in the lower area.
  return (
    <section className={`${styles.section} ${styles.fullBleed}`}>
      {heroKey ? (
        <Image
          src={assetUrl(heroKey)}
          alt=""
          fill
          sizes="100vw"
          className={styles.img}
          priority
        />
      ) : (
        <div className={styles.fullBleedGround} />
      )}
      <span className={styles.scrim} />
      <div className={styles.fullBleedCaption}>
        {scriptLine && <p className={styles.scriptOverlay}>{scriptLine}</p>}
        <h1 className={hasNames ? styles.namesOverlay : styles.fallbackOverlay}>{names}</h1>
        {dateTime && <p className={styles.dateOverlay}>{formatDateNumeric(dateTime)}</p>}
      </div>
    </section>
  );
}
