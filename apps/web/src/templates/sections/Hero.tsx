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
};

const FALLBACK_HEADING = "저희 결혼합니다";

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
