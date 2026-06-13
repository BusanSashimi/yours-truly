import Image from "next/image";
import { assetUrl } from "@/lib/assets";
import type { TemplateProps } from "../types";
import { displaySerif, serifKr, sansKr } from "../fonts";
import { formatDate, formatWeekdayTime, mapSearchUrl } from "../format";
import styles from "./minimal.module.scss";

/** Minimal stroke clock for the date row. */
function ClockIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

/** Minimal stroke envelope for the message row. */
function EnvelopeIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="3" y="5.5" width="18" height="13" rx="1.5" />
      <path d="m3.5 7.5 8.5 6 8.5-6" />
    </svg>
  );
}

/**
 * Template "minimal" — airy logistics-forward gallery. Sans-voiced column on a
 * paper ground: light display heading, a muted photo with a floating white
 * venue card over its bottom edge, and circle-iconed info rows.
 */
export function MinimalTemplate({ fields, heroKey }: TemplateProps) {
  const mapUrl = mapSearchUrl(fields);
  const hasVenueCard = Boolean(fields.venueName || fields.venueAddress);

  return (
    <main
      className={`${styles.page} ${displaySerif.variable} ${serifKr.variable} ${sansKr.variable}`}
    >
      <article className={styles.column}>
        <header className={styles.header}>
          <p className={styles.eyebrow}>Wedding Invitation</p>
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
          <hr className={styles.rule} />
        </header>

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

        {hasVenueCard && (
          <section
            className={`${styles.venueCard} ${heroKey ? styles.floating : styles.flat}`}
          >
            {fields.venueName && <h2 className={styles.venueName}>{fields.venueName}</h2>}
            {fields.venueAddress && (
              <p className={styles.venueAddress}>{fields.venueAddress}</p>
            )}
            {mapUrl && (
              <a className={styles.mapLink} href={mapUrl} target="_blank" rel="noreferrer">
                지도에서 열기 ↗
              </a>
            )}
          </section>
        )}

        {(fields.dateTime || fields.message) && (
          <section className={styles.rows}>
            {fields.dateTime && (
              <div className={styles.row}>
                <span className={styles.rowIcon}>
                  <ClockIcon />
                </span>
                <div>
                  <p className={styles.rowLabel}>Date &amp; Time</p>
                  <p className={styles.rowBody}>
                    {formatDate(fields.dateTime)}
                    <br />
                    {formatWeekdayTime(fields.dateTime)}
                  </p>
                </div>
              </div>
            )}

            {fields.message && (
              <div className={styles.row}>
                <span className={styles.rowIcon}>
                  <EnvelopeIcon />
                </span>
                <div>
                  <p className={styles.rowLabel}>Our Words</p>
                  <p className={`${styles.rowBody} ${styles.message}`}>{fields.message}</p>
                </div>
              </div>
            )}
          </section>
        )}

      </article>
    </main>
  );
}
