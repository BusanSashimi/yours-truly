import Image from "next/image";
import type { InvitationDesignFields } from "@yours-truly/shared";
import { assetUrl } from "@/lib/assets";
import type { TemplateProps } from "../types";
import { displaySerif, serifKr, sansKr } from "../fonts";
import { formatDate, formatDateNumeric, formatWeekdayTime, mapSearchUrl } from "../format";
import styles from "./modern.module.scss";

/**
 * Template "modern" — cinematic full-bleed. A full-viewport photo under a dark
 * scrim carries the white overlay (save-the-date eyebrow, italic display
 * names, numeric date, add-to-calendar pill); details sit below the fold on a
 * white ground as thin-bordered cards with gold small-caps labels.
 */
export function ModernTemplate({ fields, heroKey }: TemplateProps) {
  const mapUrl = mapSearchUrl(fields);
  const calendarHref = calendarUrl(fields);
  const hasDetails = Boolean(
    fields.message || fields.dateTime || fields.venueName || fields.venueAddress,
  );

  return (
    <main
      className={`${styles.page} ${displaySerif.variable} ${serifKr.variable} ${sansKr.variable}`}
    >
      <header className={styles.hero}>
        {heroKey && (
          <Image
            src={assetUrl(heroKey)}
            alt=""
            fill
            priority
            sizes="100vw"
            className={styles.heroImg}
          />
        )}
        <div className={styles.scrim} aria-hidden />

        <div className={styles.overlay}>
          <p className={styles.eyebrow}>Save the date</p>

          {fields.groomName && fields.brideName ? (
            <h1 className={styles.names}>
              The Wedding of
              <br />
              {fields.groomName}
              <span className={styles.amp} aria-hidden>
                &amp;
              </span>
              {fields.brideName}
            </h1>
          ) : (
            <h1 className={styles.names}>저희 결혼합니다</h1>
          )}

          {fields.dateTime && (
            <p className={styles.numericDate}>{formatDateNumeric(fields.dateTime)}</p>
          )}

          {calendarHref && (
            <a
              className={styles.calendarButton}
              href={calendarHref}
              target="_blank"
              rel="noreferrer"
            >
              <CalendarIcon />
              캘린더에 추가
            </a>
          )}
        </div>

        {hasDetails && (
          <a className={styles.scrollCue} href="#details">
            Tell me more
            <ChevronIcon />
          </a>
        )}
      </header>

      {hasDetails && (
        <section id="details" className={styles.details}>
          <div className={styles.column}>
            <h2 className={styles.heading}>A Modern Celebration</h2>

            {fields.message && <p className={styles.message}>{fields.message}</p>}

            {(fields.venueName || fields.venueAddress || fields.dateTime) && (
              <div className={styles.cards}>
                {(fields.venueName || fields.venueAddress) && (
                  <div className={styles.card}>
                    <span className={styles.cardIcon}>
                      <PinIcon />
                    </span>
                    <p className={styles.cardLabel}>The Venue</p>
                    {fields.venueName && <p className={styles.cardTitle}>{fields.venueName}</p>}
                    {fields.venueAddress && (
                      <p className={styles.cardSub}>{fields.venueAddress}</p>
                    )}
                  </div>
                )}

                {fields.dateTime && (
                  <div className={styles.card}>
                    <span className={styles.cardIcon}>
                      <CalendarIcon />
                    </span>
                    <p className={styles.cardLabel}>The Day</p>
                    <p className={styles.cardTitle}>{formatDate(fields.dateTime)}</p>
                    <p className={styles.cardSub}>{formatWeekdayTime(fields.dateTime)}</p>
                  </div>
                )}
              </div>
            )}

            {mapUrl && (
              <a className={styles.mapButton} href={mapUrl} target="_blank" rel="noreferrer">
                지도 보기
              </a>
            )}
          </div>
        </section>
      )}
    </main>
  );
}

/**
 * Google Calendar "add event" template link — a 2-hour block starting at the
 * ceremony instant, or undefined when no date is set.
 */
function calendarUrl(fields: InvitationDesignFields): string | undefined {
  if (!fields.dateTime) return undefined;
  const start = new Date(fields.dateTime);
  const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
  const title =
    fields.groomName && fields.brideName
      ? `${fields.groomName} ♥ ${fields.brideName} 결혼식`
      : "결혼식";
  const location = [fields.venueName, fields.venueAddress].filter(Boolean).join(" ");
  return (
    "https://calendar.google.com/calendar/render?action=TEMPLATE" +
    `&text=${encodeURIComponent(title)}` +
    `&dates=${toCalendarInstant(start)}/${toCalendarInstant(end)}` +
    (location ? `&location=${encodeURIComponent(location)}` : "")
  );
}

/** UTC instant in the basic format Google Calendar expects: YYYYMMDDTHHMMSSZ. */
function toCalendarInstant(date: Date): string {
  return date.toISOString().replace(/\.\d{3}/, "").replace(/[-:]/g, "");
}

function CalendarIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M16 3v4M8 3v4M3 11h18" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 21s-7-5.5-7-11a7 7 0 0 1 14 0c0 5.5-7 11-7 11Z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}
