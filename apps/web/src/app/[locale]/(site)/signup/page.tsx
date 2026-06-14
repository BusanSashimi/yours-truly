"use client";

import { Link, useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useState, type FormEvent } from "react";
import { authClient } from "@/lib/auth-client";
import { NaverLoginButton } from "../naver-login-button";
import styles from "../login/auth-form.module.scss";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const t = useTranslations("Auth");

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const { error } = await authClient.signUp.email({ name, email, password });
    if (error) {
      setError(
        error.code === "USER_ALREADY_EXISTS"
          ? t("emailExists")
          : (error.message ?? t("signupFailed")),
      );
      setPending(false);
      return;
    }
    router.push("/dashboard");
  }

  return (
    <main className={styles.page}>
      <form className={styles.card} onSubmit={onSubmit}>
        <h1 className={styles.title}>{t("signup")}</h1>
        <p className={styles.sub}>{t("signupSubtitle")}</p>

        <label className={styles.field}>
          <span>{t("name")}</span>
          <input
            type="text"
            autoComplete="name"
            required
            maxLength={120}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
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
          <span>{t("passwordHint")}</span>
          <input
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>

        {error && <p className={styles.error}>{error}</p>}

        <button type="submit" className={styles.submit} disabled={pending}>
          {pending ? t("signingUp") : t("signupSubmit")}
        </button>

        <p className={styles.alt}>
          {t("haveAccount")} <Link href="/login">{t("login")}</Link>
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
