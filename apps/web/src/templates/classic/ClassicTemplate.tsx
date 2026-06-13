import Image from "next/image";
import { assetUrl } from "@/lib/assets";
import type { TemplateProps } from "../types";
import { displaySerif, sansKr, serifKr } from "../fonts";
import { formatDate, formatWeekdayTime, mapSearchUrl } from "../format";
import styles from "./classic.module.scss";

/**
 * Template "classic" — cream editorial. Centered serif column on an eggshell
 * ground: framed photo, gold small-caps eyebrows, a quote-like message, a
 * large display date, and an outlined map button.
 */
export function ClassicTemplate({ fields, heroKey }: TemplateProps) {
  const mapUrl = mapSearchUrl(fields);

  return (
    <main
      className={`${styles.page} ${displaySerif.variable} ${serifKr.variable} ${sansKr.variable}`}
    >
      <article className={styles.column}>
        {heroKey && (
          <div className={styles.hero}>
            <Image
              src={assetUrl(heroKey)}
              alt=""
              fill
              priority
              sizes="(max-width: 480px) 100vw, 420px"
              className={styles.heroImg}
            />
          </div>
        )}

        <p className={styles.eyebrow}>Join us for the celebration</p>

        {fields.groomName && fields.brideName ? (
          <h1 className={styles.names}>
            {fields.groomName}
            <span className={styles.amp} aria-hidden>
              &amp;
            </span>
            {fields.brideName}
          </h1>
        ) : (
          <h1 className={styles.names}>저희 결혼합니다</h1>
        )}

        {fields.message && <p className={styles.message}>{fields.message}</p>}

        {fields.dateTime && (
          <section className={styles.dateBlock}>
            <hr className={styles.rule} />
            <p className={styles.date}>{formatDate(fields.dateTime)}</p>
            <p className={styles.dateSub}>{formatWeekdayTime(fields.dateTime)}</p>
            <hr className={`${styles.rule} ${styles.ruleBelow}`} />
          </section>
        )}

        {(fields.venueName || fields.venueAddress) && (
          <section className={styles.venue}>
            <p className={styles.sectionEyebrow}>The Venue</p>
            {fields.venueName && <p className={styles.venueName}>{fields.venueName}</p>}
            {fields.venueAddress && (
              <p className={styles.venueAddress}>{fields.venueAddress}</p>
            )}
            {mapUrl && (
              <a className={styles.outlineButton} href={mapUrl} target="_blank" rel="noreferrer">
                지도 보기
              </a>
            )}
          </section>
        )}
      </article>
    </main>
  );
}
