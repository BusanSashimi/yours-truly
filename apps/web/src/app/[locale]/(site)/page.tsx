import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import styles from "./page.module.scss";
import { NaverLoginButton } from "./naver-login-button";

export default function Home() {
  const t = useTranslations("Marketing");
  const ta = useTranslations("Auth");
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button type="button" className={styles.menuButton} aria-label={t("menu")}>
          <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden>
            <path
              d="M3 6h18M3 12h18M3 18h18"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
        </button>
        <span className={styles.wordmark}>Yours Truly</span>
      </header>

      <main className={styles.main}>
        <div
          className={styles.hero}
          role="img"
          aria-label="Yours Truly letterpress card"
        >
          <div className={styles.heroCard}>
            <span className={styles.heroCardTitle}>Yours Truly</span>
            <span className={styles.heroCardRule} />
            <span className={styles.heroCardSub}>Maison de Lettre</span>
          </div>
        </div>

        <h1 className={styles.heading}>
          Crafting Your
          <span className={styles.headingItalic}>Timeless Narrative</span>
        </h1>

        <p className={styles.sub}>{t("sub")}</p>

        <NaverLoginButton className={styles.cta} errorClassName={styles.ctaError}>
          <span className={styles.naverMark} aria-hidden>
            N
          </span>
          {ta("naverStart")}
        </NaverLoginButton>

        <Link href="/login" className={styles.otherOptions}>
          {t("otherOptions")}
        </Link>

        <div className={styles.divider} />

        <Link href="/samples" className={styles.explore}>
          {t("exploreFirst")}
          <span aria-hidden>&rarr;</span>
        </Link>
      </main>

      <footer className={styles.footer}>
        <nav className={styles.footerLinks}>
          <a href="#">{t("footerTerms")}</a>
          <a href="#">{t("footerPrivacy")}</a>
          <a href="#">{t("footerContact")}</a>
        </nav>
        <p className={styles.copyright}>
          © 2024 Yours Truly. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
