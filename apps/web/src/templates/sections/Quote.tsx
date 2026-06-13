import { type InvitationDesignFields } from "@yours-truly/shared";
import { Container } from "../theme";
import styles from "./Quote.module.scss";

/**
 * A decorative epigraph — `quote.text` set in italic display type, with an
 * optional small muted `quote.source` attribution below. Centered with
 * generous vertical breathing room. Renders nothing without text.
 * Themed entirely via CSS variables.
 */
export function Quote({ quote }: { quote?: InvitationDesignFields["quote"] }) {
  const text = quote?.text;
  if (!text) return null;

  return (
    <section className={styles.section}>
      <Container>
        <figure className={styles.figure}>
          <span className={styles.mark} aria-hidden="true">
            &ldquo;
          </span>
          <blockquote className={styles.text}>{text}</blockquote>
          {quote?.source && (
            <figcaption className={styles.source}>{quote.source}</figcaption>
          )}
        </figure>
      </Container>
    </section>
  );
}
