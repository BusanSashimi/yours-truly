import { useTranslations } from "next-intl";
import { Container } from "../theme";
import styles from "./Wreath.module.scss";

/**
 * 축하화환 보내기 — a single centered outlined button linking out to a wreath/gift
 * ordering page (opens in a new tab). Themed entirely via CSS variables.
 * Renders nothing without a `wreathUrl`.
 */
export function Wreath({ wreathUrl }: { wreathUrl?: string }) {
  const t = useTranslations("Invitation.Wreath");
  if (!wreathUrl) return null;
  return (
    <section className={styles.section}>
      <Container>
        <a className={styles.button} href={wreathUrl} target="_blank" rel="noreferrer">
          <svg
            className={styles.icon}
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M12 21c-3.5-2.5-7-5.4-7-9.2A3.8 3.8 0 0 1 12 9a3.8 3.8 0 0 1 7 2.8c0 3.8-3.5 6.7-7 9.2Z"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinejoin="round"
            />
            <path
              d="M12 9c0-2.2-1-4-3-4M12 9c0-2.2 1-4 3-4"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
            />
          </svg>
          {t("button")}
        </a>
      </Container>
    </section>
  );
}
