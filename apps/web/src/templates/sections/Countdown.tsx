"use client";

import { useEffect, useState } from "react";
import { countdownParts } from "../format";
import { Container, Eyebrow } from "../theme";
import styles from "./Countdown.module.scss";

/**
 * Countdown (D-Day) — a client island that ticks once a second toward the
 * ceremony. `now` starts null and is set in an effect after mount, so the
 * server and first client render agree (no hydration mismatch); the badges
 * fill in once the clock is live. Renders nothing without a date.
 */
export function Countdown({ dateTime }: { dateTime?: string }) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!dateTime) return null;

  const parts = now === null ? null : countdownParts(dateTime, now);
  const units: { label: string; value: number | null }[] = [
    { label: "Days", value: parts?.days ?? null },
    { label: "Hours", value: parts?.hours ?? null },
    { label: "Minutes", value: parts?.minutes ?? null },
    { label: "Seconds", value: parts?.seconds ?? null },
  ];

  return (
    <section className={styles.section}>
      <Container>
        <Eyebrow>Countdown</Eyebrow>
        <div className={styles.badges}>
          {units.map((unit) => (
            <div key={unit.label} className={styles.badge}>
              <span className={styles.value}>
                {unit.value === null ? "--" : String(unit.value).padStart(2, "0")}
              </span>
              <span className={styles.label}>{unit.label}</span>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
