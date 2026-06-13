import Image from "next/image";
import { type InvitationDesignFields } from "@yours-truly/shared";
import { assetUrl } from "@/lib/assets";
import { Container, Eyebrow, SectionTitle } from "../theme";
import styles from "./Timeline.module.scss";

/**
 * Relationship timeline (우리의 시간 / 히스토리) — a vertical dotted rule with a
 * marker per milestone. Each entry shows an optional date/label in accent
 * small-caps, a title (the entry `label`), body text, and an optional photo.
 * Server component (no interactivity). Renders nothing without milestones;
 * individual entries degrade gracefully when fields are missing.
 */
export function Timeline({
  entries,
}: {
  entries?: InvitationDesignFields["timeline"];
}) {
  const items = entries?.filter(
    (entry) => entry.date || entry.label || entry.text || entry.imageKey,
  );
  if (!items || items.length === 0) return null;

  return (
    <section className={styles.section}>
      <Container>
        <Eyebrow>Our Story</Eyebrow>
        <SectionTitle>우리의 이야기</SectionTitle>
        <ol className={styles.list}>
          {items.map((entry, index) => (
            <li key={index} className={styles.item}>
              <span className={styles.marker} aria-hidden />
              <div className={styles.body}>
                {entry.date && <p className={styles.date}>{entry.date}</p>}
                {entry.label && <h3 className={styles.title}>{entry.label}</h3>}
                {entry.imageKey && (
                  <div className={styles.photo}>
                    <Image
                      src={assetUrl(entry.imageKey)}
                      alt=""
                      fill
                      sizes="(max-width: 480px) 80vw, 360px"
                      className={styles.img}
                    />
                  </div>
                )}
                {entry.text && <p className={styles.text}>{entry.text}</p>}
              </div>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}
