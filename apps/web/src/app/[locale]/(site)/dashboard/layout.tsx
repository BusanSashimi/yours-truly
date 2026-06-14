"use client";

import { Link, useRouter } from "@/i18n/navigation";
import { useEffect } from "react";
import { authClient } from "@/lib/auth-client";
import styles from "./dashboard.module.scss";

/** Auth guard + chrome for everything under /dashboard. */
export default function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  useEffect(() => {
    if (!isPending && !session) router.replace("/login");
  }, [isPending, session, router]);

  if (isPending || !session) return null;

  async function signOut() {
    await authClient.signOut();
    router.push("/");
  }

  return (
    <div className={styles.shell}>
      <header className={styles.topbar}>
        <Link href="/dashboard" className={styles.wordmark}>
          Yours Truly
        </Link>
        <div className={styles.account}>
          <span className={styles.accountName}>{session.user.name}</span>
          <button type="button" className={styles.signOut} onClick={signOut}>
            로그아웃
          </button>
        </div>
      </header>
      <main className={styles.main}>{children}</main>
    </div>
  );
}
