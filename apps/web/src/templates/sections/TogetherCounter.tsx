"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { sinceParts } from "../format";
import { Container, Eyebrow, SectionTitle } from "../theme";
import styles from "./TogetherCounter.module.scss";

/** Zero-pad a clock component to two digits ("7" → "07"). */
function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/**
 * 함께한 시간 — a client island that counts the elapsed time since `startDate`.
 * Shows a "{years}년 {months}개월 {days}일" headline and a live HH:MM:SS ticker
 * derived from total elapsed seconds. The current time is seeded in an effect
 * (not during render) so the server-rendered markup and the first client paint
 * match; the ticker only appears once mounted. Renders nothing without a date.
 */
export function TogetherCounter({ startDate }: { startDate?: string }) {
  const [nowMs, setNowMs] = useState<number | null>(null);

  useEffect(() => {
    if (!startDate) return;
    setNowMs(Date.now());
    const id = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(id);
  }, [startDate]);

  const t = useTranslations("Invitation.TogetherCounter");

  if (!startDate) return null;

  const parts = nowMs === null ? null : sinceParts(startDate, nowMs);
  const clock =
    parts === null
      ? null
      : {
          hours: Math.floor((parts.totalSeconds % 86400) / 3600),
          minutes: Math.floor((parts.totalSeconds % 3600) / 60),
          seconds: parts.totalSeconds % 60,
        };

  return (
    <section className={styles.section}>
      <Container>
        <Eyebrow>Since the Beginning</Eyebrow>
        <SectionTitle>{t("title")}</SectionTitle>
        {parts && (
          <p className={styles.headline}>
            <span className={styles.unit}>
              <span className={styles.value}>{parts.years}</span>
              <span className={styles.label}>{t("years")}</span>
            </span>
            <span className={styles.unit}>
              <span className={styles.value}>{parts.months}</span>
              <span className={styles.label}>{t("months")}</span>
            </span>
            <span className={styles.unit}>
              <span className={styles.value}>{parts.days}</span>
              <span className={styles.label}>{t("days")}</span>
            </span>
          </p>
        )}
        {clock && (
          <p className={styles.clock} aria-label={t("clockAria")}>
            {pad(clock.hours)}:{pad(clock.minutes)}:{pad(clock.seconds)}
          </p>
        )}
      </Container>
    </section>
  );
}
