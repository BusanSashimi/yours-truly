import { useTranslations } from "next-intl";
import styles from "./page.module.scss";

/** Guest-facing 404: unknown slug, or an invitation that is still a draft. */
export default function InvitationNotFound() {
  const t = useTranslations("NotFound");
  return (
    <main className={styles.page}>
      <div className={styles.notFound}>
        <h1>{t("title")}</h1>
        <p>{t("body")}</p>
      </div>
    </main>
  );
}
