"use client";

import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
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
  const t = useTranslations("Invitation.Rsvp");
  const tc = useTranslations("Common");

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) {
      setError(t("nameRequired"));
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
      setError(e instanceof Error ? e.message : t("sendError"));
      setStatus("idle");
    }
  }

  return (
    <section className={styles.section}>
      <Container>
        <Eyebrow>RSVP</Eyebrow>
        <SectionTitle>{t("title")}</SectionTitle>
        {status === "done" ? (
          <p className={styles.thanks}>{t("thanks")}</p>
        ) : (
          <form className={styles.form} onSubmit={onSubmit}>
            <div className={styles.choice}>
              <button
                type="button"
                className={attendance === "yes" ? styles.choiceOn : styles.choiceOff}
                onClick={() => setAttendance("yes")}
              >
                {t("attend")}
              </button>
              <button
                type="button"
                className={attendance === "no" ? styles.choiceOn : styles.choiceOff}
                onClick={() => setAttendance("no")}
              >
                {t("decline")}
              </button>
            </div>
            <input
              className={styles.input}
              placeholder={t("namePlaceholder")}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <div className={styles.row}>
              <select
                className={styles.input}
                value={side}
                onChange={(e) => setSide(e.target.value as typeof side)}
              >
                <option value="">{t("sidePlaceholderDefault")}</option>
                <option value="groom">{tc("groomSide")}</option>
                <option value="bride">{tc("brideSide")}</option>
              </select>
              <input
                className={styles.input}
                type="number"
                min="1"
                value={headcount}
                onChange={(e) => setHeadcount(e.target.value)}
                aria-label={t("headcountAria")}
              />
            </div>
            <textarea
              className={styles.input}
              placeholder={t("messagePlaceholder")}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            {error && <p className={styles.error}>{error}</p>}
            <button type="submit" className={styles.submit} disabled={status === "sending"}>
              {status === "sending" ? t("sending") : t("submit")}
            </button>
          </form>
        )}
      </Container>
    </section>
  );
}
