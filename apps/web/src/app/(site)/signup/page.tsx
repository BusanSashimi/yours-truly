"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
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

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const { error } = await authClient.signUp.email({ name, email, password });
    if (error) {
      setError(
        error.code === "USER_ALREADY_EXISTS"
          ? "이미 가입된 이메일입니다."
          : (error.message ?? "회원가입에 실패했습니다."),
      );
      setPending(false);
      return;
    }
    router.push("/dashboard");
  }

  return (
    <main className={styles.page}>
      <form className={styles.card} onSubmit={onSubmit}>
        <h1 className={styles.title}>회원가입</h1>
        <p className={styles.sub}>몇 초면 나만의 청첩장을 만들 수 있어요.</p>

        <label className={styles.field}>
          <span>이름</span>
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
          <span>비밀번호 (8자 이상)</span>
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
          {pending ? "가입 중…" : "가입하기"}
        </button>

        <p className={styles.alt}>
          이미 계정이 있으신가요? <Link href="/login">로그인</Link>
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
