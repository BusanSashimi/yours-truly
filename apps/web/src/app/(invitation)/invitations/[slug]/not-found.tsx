import styles from "./page.module.scss";

/** Guest-facing 404: unknown slug, or an invitation that is still a draft. */
export default function InvitationNotFound() {
  return (
    <main className={styles.page}>
      <div className={styles.notFound}>
        <h1>청첩장을 찾을 수 없습니다</h1>
        <p>주소가 정확한지 다시 한번 확인해 주세요.</p>
      </div>
    </main>
  );
}
