import type { InvitationDesignFields } from "@yours-truly/shared";
import { useLocale, useTranslations } from "next-intl";
import { formatDate, formatWeekdayTime } from "../format";
import { Container, Eyebrow, SectionTitle } from "../theme";
import styles from "./Reception.module.scss";

/**
 * Reception notice (피로연 안내) — a single surface card with the reception's
 * date/time, venue, address, and a free-text note (`white-space: pre-line`).
 * Each field renders only when present; the section renders nothing when the
 * reception has no usable data. Themed entirely via CSS variables.
 */
export function Reception({ reception }: { reception?: InvitationDesignFields["reception"] }) {
  const t = useTranslations("Invitation.Reception");
  const locale = useLocale();
  if (!reception) return null;
  const { dateTime, venue, address, note } = reception;
  if (!dateTime && !venue && !address && !note) return null;

  return (
    <section className={styles.section}>
      <Container>
        <Eyebrow>Reception</Eyebrow>
        <SectionTitle>{t("title")}</SectionTitle>
        <div className={styles.card}>
          {dateTime && (
            <p className={styles.date}>
              <span className={styles.dateLine}>{formatDate(dateTime, locale)}</span>
              <span className={styles.timeLine}>{formatWeekdayTime(dateTime, locale)}</span>
            </p>
          )}
          {venue && <p className={styles.venue}>{venue}</p>}
          {address && <p className={styles.address}>{address}</p>}
          {note && <p className={styles.note}>{note}</p>}
        </div>
      </Container>
    </section>
  );
}
