import Image from "next/image";
import { assetUrl } from "@/lib/assets";
import type { TemplateProps } from "../types";
import { displaySerif, serifKr } from "../fonts";
import { formatDate, formatWeekdayTime, mapSearchUrl } from "../format";
import styles from "./romantic.module.scss";

/** Map pin for the outlined venue button. */
function MapPinIcon() {
  return (
    <svg
      className={styles.pin}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

/**
 * Template "romantic" — warm polaroid keepsake. A gently tilted white polaroid
 * frame holds the photo with the names captioned inside it, followed by a
 * gold italic invite line, small-caps date/venue details, and a letter-like
 * message on warm cream.
 */
export function RomanticTemplate({ fields, heroKey }: TemplateProps) {
  const mapUrl = mapSearchUrl(fields);
  const venueLine = [fields.venueName, fields.venueAddress].filter(Boolean).join(" · ");

  // The polaroid's caption; without a photo it stands alone as the heading.
  const caption = (
    <>
      <p className={styles.eyebrow}>Together with their families</p>
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
    </>
  );

  return (
    <main className={`${styles.page} ${displaySerif.variable} ${serifKr.variable}`}>
      <article className={styles.column}>
        {heroKey ? (
          <figure className={styles.polaroid}>
            <div className={styles.photo}>
              <Image
                src={assetUrl(heroKey)}
                alt=""
                fill
                priority
                sizes="(max-width: 480px) 100vw, 320px"
                className={styles.photoImg}
              />
            </div>
            <figcaption className={styles.caption}>{caption}</figcaption>
          </figure>
        ) : (
          <header className={styles.plainHeading}>{caption}</header>
        )}

        <p className={styles.inviteLine}>invite you to celebrate their union</p>

        {(fields.dateTime || venueLine) && (
          <section className={styles.details}>
            {fields.dateTime && (
              <p className={styles.detailLine}>
                {formatDate(fields.dateTime)} {formatWeekdayTime(fields.dateTime)}
              </p>
            )}
            {venueLine && <p className={styles.detailLine}>{venueLine}</p>}
          </section>
        )}

        {fields.message && (
          <section className={styles.letter}>
            <hr className={styles.flourish} />
            <p className={styles.message}>{fields.message}</p>
          </section>
        )}

        {mapUrl && (
          <section className={styles.mapBlock}>
            <hr className={styles.flourish} />
            <a className={styles.outlineButton} href={mapUrl} target="_blank" rel="noreferrer">
              <MapPinIcon />
              지도 보기
            </a>
          </section>
        )}
      </article>
    </main>
  );
}
