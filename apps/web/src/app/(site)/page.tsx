import styles from "./page.module.scss";

export default function Home() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button type="button" className={styles.menuButton} aria-label="Menu">
          <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden>
            <path
              d="M3 6h18M3 12h18M3 18h18"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
        </button>
        <span className={styles.wordmark}>Salon de Letter</span>
      </header>

      <main className={styles.main}>
        <div
          className={styles.hero}
          role="img"
          aria-label="Salon de Letter letterpress card"
        >
          <div className={styles.heroCard}>
            <span className={styles.heroCardTitle}>Salon de Letter</span>
            <span className={styles.heroCardRule} />
            <span className={styles.heroCardSub}>Maison de Lettre</span>
          </div>
        </div>

        <h1 className={styles.heading}>
          Crafting Your
          <span className={styles.headingItalic}>Timeless Narrative</span>
        </h1>

        <p className={styles.sub}>1초 회원가입으로 간편로그인</p>

        <button type="button" className={styles.cta}>
          <span className={styles.naverMark} aria-hidden>
            N
          </span>
          네이버로 시작하기
        </button>

        <a href="#" className={styles.otherOptions}>
          Other Login Options
        </a>

        <div className={styles.divider} />

        <a href="#" className={styles.explore}>
          Explore First
          <span aria-hidden>&rarr;</span>
        </a>
      </main>

      <footer className={styles.footer}>
        <nav className={styles.footerLinks}>
          <a href="#">Terms</a>
          <a href="#">Privacy</a>
          <a href="#">Contact</a>
        </nav>
        <p className={styles.copyright}>
          © 2024 Salon de Letter. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
