import { useTranslations } from "next-intl";
import { Container, Eyebrow } from "../theme";
import styles from "./Greeting.module.scss";

/**
 * The invitation greeting (모시는 글) — an eyebrow, an optional short title, and
 * the message in `white-space: pre-line`. Renders nothing without a message.
 * Themed entirely via CSS variables; no template-specific styling here.
 */
export function Greeting({
  message,
  eyebrow = "Invitation",
  titleKey,
}: {
  message?: string;
  eyebrow?: string;
  titleKey?: "weAreMarrying" | "invitingLovedOnes";
}) {
  const t = useTranslations("Invitation.Greeting");
  if (!message && !titleKey) return null;
  return (
    <section className={styles.section}>
      <Container>
        <Eyebrow>{eyebrow}</Eyebrow>
        {titleKey && <h2 className={styles.title}>{t(titleKey)}</h2>}
        {message && <p className={styles.message}>{message}</p>}
      </Container>
    </section>
  );
}
