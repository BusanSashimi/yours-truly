"use client";

import { useState, type FormEvent } from "react";
import type { CreateRsvpInput } from "@yours-truly/shared";
import { submitRsvp } from "@/lib/api";
import { Container, Eyebrow, SectionTitle } from "../theme";
import styles from "./Rsvp.module.scss";

/**
 * RSVP (참석 여부 전달) — a client island that posts to the public RSVP endpoint.
 * Themed via CSS variables. Shows a thank-you state after a successful submit.
 */
export function Rsvp({ invitationId }: { invitationId: string }) {
  const [attendance, setAttendance] = useState<"yes" | "no">("yes");
  const [name, setName] = useState("");
  const [side, setSide] = useState<"" | "groom" | "bride">("");
  const [headcount, setHeadcount] = useState("1");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) {
      setError("성함을 입력해 주세요.");
      return;
    }
    setStatus("sending");
    setError(null);
    try {
      const input: CreateRsvpInput = {
        name: name.trim(),
        attendance,
        ...(side ? { side } : {}),
        headcount: Math.max(1, Number(headcount) || 1),
        ...(message.trim() ? { message: message.trim() } : {}),
      };
      await submitRsvp(invitationId, input);
      setStatus("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "전송에 실패했습니다.");
      setStatus("idle");
    }
  }

  return (
    <section className={styles.section}>
      <Container>
        <Eyebrow>RSVP</Eyebrow>
        <SectionTitle>참석 여부 전달</SectionTitle>
        {status === "done" ? (
          <p className={styles.thanks}>참석 여부를 전달해 주셔서 감사합니다.</p>
        ) : (
          <form className={styles.form} onSubmit={onSubmit}>
            <div className={styles.choice}>
              <button
                type="button"
                className={attendance === "yes" ? styles.choiceOn : styles.choiceOff}
                onClick={() => setAttendance("yes")}
              >
                참석
              </button>
              <button
                type="button"
                className={attendance === "no" ? styles.choiceOn : styles.choiceOff}
                onClick={() => setAttendance("no")}
              >
                불참
              </button>
            </div>
            <input
              className={styles.input}
              placeholder="성함"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <div className={styles.row}>
              <select
                className={styles.input}
                value={side}
                onChange={(e) => setSide(e.target.value as typeof side)}
              >
                <option value="">구분 선택</option>
                <option value="groom">신랑측</option>
                <option value="bride">신부측</option>
              </select>
              <input
                className={styles.input}
                type="number"
                min="1"
                value={headcount}
                onChange={(e) => setHeadcount(e.target.value)}
                aria-label="참석 인원"
              />
            </div>
            <textarea
              className={styles.input}
              placeholder="전하실 말씀 (선택)"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            {error && <p className={styles.error}>{error}</p>}
            <button type="submit" className={styles.submit} disabled={status === "sending"}>
              {status === "sending" ? "전송 중…" : "참석 여부 전달"}
            </button>
          </form>
        )}
      </Container>
    </section>
  );
}
