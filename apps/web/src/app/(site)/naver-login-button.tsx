"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";

/**
 * Starts the Naver OAuth flow (Better Auth redirects the window to Naver).
 * Markup and styling come from the caller — this is used both by the landing
 * CTA and the auth pages. When the provider isn't configured on the API
 * (e.g. local dev without NAVER_* envs), it degrades to an inline message.
 */
export function NaverLoginButton({
  className,
  errorClassName,
  children,
}: {
  className?: string;
  errorClassName?: string;
  children: React.ReactNode;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function start() {
    setError(null);
    setPending(true);
    const { error } = await authClient.signIn.social({
      provider: "naver",
      callbackURL: "/dashboard",
      errorCallbackURL: "/login?error=naver",
    });
    // On success the client navigates away; we only get here on failure.
    if (error) {
      setError("네이버 로그인을 사용할 수 없습니다. 이메일로 계속해 주세요.");
      setPending(false);
    }
  }

  return (
    <>
      <button type="button" className={className} onClick={start} disabled={pending}>
        {children}
      </button>
      {error && (
        <p role="alert" className={errorClassName}>
          {error}
        </p>
      )}
    </>
  );
}
