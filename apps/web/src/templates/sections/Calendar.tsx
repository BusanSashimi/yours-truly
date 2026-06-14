import { useLocale, useTranslations } from "next-intl";
import { formatWeekdayTime, monthMatrix } from "../format";
import { Container, Eyebrow } from "../theme";
import styles from "./Calendar.module.scss";

/**
 * The wedding-month calendar. A Sun-first month grid (weekday header + week
 * rows) built from monthMatrix; the ceremony day is a filled accent circle.
 * Below the grid sits the weekday + time line. Server component — purely
 * derived from the date, so no client state. Renders nothing without a date.
 */
export function Calendar({ dateTime }: { dateTime?: string }) {
  const t = useTranslations("Invitation.Calendar");
  const locale = useLocale();
  if (!dateTime) return null;
  const weekdays = t.raw("weekdays") as string[];
  const { weeks, weddingDay } = monthMatrix(dateTime);
  return (
    <section className={styles.section}>
      <Container>
        <Eyebrow>Wedding Day</Eyebrow>
        <div className={styles.calendar}>
          <div className={styles.weekHeader}>
            {weekdays.map((label, i) => (
              <span
                key={label}
                className={`${styles.weekday} ${
                  i === 0 ? styles.sun : i === 6 ? styles.sat : ""
                }`}
              >
                {label}
              </span>
            ))}
          </div>
          <div className={styles.grid}>
            {weeks.map((week, w) =>
              week.map((day, d) => (
                <span
                  key={`${w}-${d}`}
                  className={`${styles.day} ${
                    day === weddingDay ? styles.wedding : ""
                  } ${day !== 0 && d === 0 ? styles.sun : ""} ${
                    day !== 0 && d === 6 ? styles.sat : ""
                  }`}
                >
                  {day !== 0 ? day : ""}
                </span>
              )),
            )}
          </div>
        </div>
        <p className={styles.time}>{formatWeekdayTime(dateTime, locale)}</p>
      </Container>
    </section>
  );
}
