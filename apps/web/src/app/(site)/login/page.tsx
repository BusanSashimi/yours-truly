"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
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

  // Better Auth lands here with ?error=naver when the OAuth flow fails
  // (errorCallbackURL). Read via window.location instead of useSearchParams
  // to keep the page statically prerenderable without a Suspense boundary.
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("error") === "naver") {
      setError("네이버 로그인에 실패했습니다. 다시 시도하거나 이메일로 로그인해 주세요.");
    }
  }, []);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const { error } = await authClient.signIn.email({ email, password });
    if (error) {
      setError(
        error.status === 401
          ? "이메일 또는 비밀번호가 올바르지 않습니다."
          : (error.message ?? "로그인에 실패했습니다."),
      );
      setPending(false);
      return;
    }
    router.push("/dashboard");
  }

  return (
    <main className={styles.page}>
      <form className={styles.card} onSubmit={onSubmit}>
        <h1 className={styles.title}>로그인</h1>
        <p className={styles.sub}>내 청첩장을 관리하려면 로그인하세요.</p>

        <label className={styles.field}>
          <span>이메일</span>
          <input
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label className={styles.field}>
          <span>비밀번호</span>
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
          {pending ? "로그인 중…" : "로그인"}
        </button>

        <p className={styles.alt}>
          아직 계정이 없으신가요? <Link href="/signup">회원가입</Link>
        </p>

        <div className={styles.orDivider}>또는</div>
        <NaverLoginButton className={styles.naver} errorClassName={styles.error}>
          <span className={styles.naverMark} aria-hidden>
            N
          </span>
          네이버로 시작하기
        </NaverLoginButton>
      </form>
    </main>
  );
}
