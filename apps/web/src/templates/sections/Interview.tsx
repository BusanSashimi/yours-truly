import { type InvitationDesignFields } from "@yours-truly/shared";
import { Container, Eyebrow, SectionTitle } from "../theme";
import styles from "./Interview.module.scss";

/**
 * Wedding interview (웨딩 인터뷰) — a list of questions, each with the groom's
 * and/or bride's answer. Uses native <details>/<summary> so the Q&A expands
 * without any client JS (the first question is open by default). Renders
 * nothing when there are no questions, and skips answers a couple left blank.
 */
export function Interview({ entries }: { entries?: InvitationDesignFields["interview"] }) {
  const items = entries?.filter((entry) => entry.question.trim());
  if (!items || items.length === 0) return null;

  return (
    <section className={styles.section}>
      <Container>
        <Eyebrow>Interview</Eyebrow>
        <SectionTitle>웨딩 인터뷰</SectionTitle>
        <ul className={styles.list}>
          {items.map((entry, index) => {
            const groom = entry.groomAnswer?.trim();
            const bride = entry.brideAnswer?.trim();
            if (!groom && !bride) return null;
            return (
              <li key={`${entry.question}-${index}`}>
                <details className={styles.item} open={index === 0}>
                  <summary className={styles.summary}>
                    <span className={styles.q}>Q.</span>
                    <span className={styles.question}>{entry.question}</span>
                    <span className={styles.chevron} aria-hidden="true" />
                  </summary>
                  <div className={styles.answers}>
                    {groom && (
                      <div className={styles.answer}>
                        <span className={styles.who}>신랑</span>
                        <p className={styles.text}>{groom}</p>
                      </div>
                    )}
                    {bride && (
                      <div className={styles.answer}>
                        <span className={styles.who}>신부</span>
                        <p className={styles.text}>{bride}</p>
                      </div>
                    )}
                  </div>
                </details>
              </li>
            );
          })}
        </ul>
      </Container>
    </section>
  );
}
