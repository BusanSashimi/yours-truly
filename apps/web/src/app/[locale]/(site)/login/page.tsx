"use client";

import { Link, useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useState, type FormEvent } from "react";
import { authClient } from "@/lib/auth-client";
import { NaverLoginButton } from "../naver-login-button";
import styles from "./auth-form.module.scss";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const t = useTranslations("Auth");

  // Better Auth lands here with ?error=naver when the OAuth flow fails
  // (errorCallbackURL). Read via window.location instead of useSearchParams
  // to keep the page statically prerenderable without a Suspense boundary.
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("error") === "naver") {
      setError(t("naverFailed"));
    }
  }, [t]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const { error } = await authClient.signIn.email({ email, password });
    if (error) {
      setError(
        error.status === 401
          ? t("invalidCredentials")
          : (error.message ?? t("loginFailed")),
      );
      setPending(false);
      return;
    }
    router.push("/dashboard");
  }

  return (
    <main className={styles.page}>
      <form className={styles.card} onSubmit={onSubmit}>
        <h1 className={styles.title}>{t("login")}</h1>
        <p className={styles.sub}>{t("loginSubtitle")}</p>

        <label className={styles.field}>
          <span>{t("email")}</span>
          <input
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label className={styles.field}>
          <span>{t("password")}</span>
          <input
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>

        {error && <p className={styles.error}>{error}</p>}

        <button type="submit" className={styles.submit} disabled={pending}>
          {pending ? t("loggingIn") : t("login")}
        </button>

        <p className={styles.alt}>
          {t("noAccount")} <Link href="/signup">{t("signup")}</Link>
        </p>

        <div className={styles.orDivider}>{t("or")}</div>
        <NaverLoginButton className={styles.naver} errorClassName={styles.error}>
          <span className={styles.naverMark} aria-hidden>
            N
          </span>
          {t("naverStart")}
        </NaverLoginButton>
      </form>
    </main>
  );
}
