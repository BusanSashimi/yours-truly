"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useLocale, useTranslations } from "next-intl";
import type { CreateGuestbookInput, GuestbookEntry } from "@yours-truly/shared";
import { deleteGuestbookEntry, getGuestbook, submitGuestbook } from "@/lib/api";
import { formatDate } from "../format";
import { Container, Eyebrow, SectionTitle } from "../theme";
import styles from "./Guestbook.module.scss";

const PAGE_SIZE = 5;

/**
 * Guestbook (방명록) — a client island over the public guestbook endpoint.
 * Loads the latest entries on mount with "더보기" paging, lets guests post a
 * message (optionally with a 4-digit PIN), and lets authors delete their own
 * entries by entering that PIN. Themed entirely via CSS variables.
 */
export function Guestbook({ invitationId }: { invitationId: string }) {
  const [entries, setEntries] = useState<GuestbookEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [load, setLoad] = useState<"loading" | "loadingMore" | "ready" | "error">("loading");

  // Entries this visitor authored in this session — the only ones we offer a
  // delete affordance for (the API never reveals authorship).
  const [mine, setMine] = useState<Set<string>>(new Set());

  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [pin, setPin] = useState("");
  const [status, setStatus] = useState<"idle" | "sending">("idle");
  const [formError, setFormError] = useState<string | null>(null);

  const fetchPage = useCallback(
    async (offset: number) => {
      setLoad(offset === 0 ? "loading" : "loadingMore");
      try {
        const page = await getGuestbook(invitationId, { limit: PAGE_SIZE, offset });
        setTotal(page.total);
        setEntries((prev) => (offset === 0 ? page.entries : [...prev, ...page.entries]));
        setLoad("ready");
      } catch {
        setLoad("error");
      }
    },
    [invitationId],
  );

  useEffect(() => {
    void fetchPage(0);
  }, [fetchPage]);

  const t = useTranslations("Invitation.Guestbook");
  const locale = useLocale();

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) {
      setFormError(t("nameRequired"));
      return;
    }
    if (!message.trim()) {
      setFormError(t("messageRequired"));
      return;
    }
    if (pin && !/^\d{4}$/.test(pin)) {
      setFormError(t("pinFormat"));
      return;
    }
    setStatus("sending");
    setFormError(null);
    try {
      const input: CreateGuestbookInput = {
        name: name.trim(),
        message: message.trim(),
        ...(pin ? { pin } : {}),
      };
      const created = await submitGuestbook(invitationId, input);
      setEntries((prev) => [created, ...prev]);
      setTotal((prev) => prev + 1);
      if (pin) setMine((prev) => new Set(prev).add(created.id));
      setName("");
      setMessage("");
      setPin("");
    } catch (e) {
      setFormError(e instanceof Error ? e.message : t("submitError"));
    } finally {
      setStatus("idle");
    }
  }

  async function onDelete(id: string) {
    const entered = window.prompt(t("deletePrompt"));
    if (entered == null) return;
    if (!/^\d{4}$/.test(entered)) {
      window.alert(t("pinInvalid"));
      return;
    }
    try {
      await deleteGuestbookEntry(invitationId, id, entered);
      setEntries((prev) => prev.filter((entry) => entry.id !== id));
      setTotal((prev) => Math.max(0, prev - 1));
      setMine((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    } catch (e) {
      window.alert(e instanceof Error ? e.message : t("deleteError"));
    }
  }

  const hasMore = entries.length < total;

  return (
    <section className={styles.section}>
      <Container>
        <Eyebrow>Guestbook</Eyebrow>
        <SectionTitle>{t("title")}</SectionTitle>

        {load === "loading" ? (
          <p className={styles.notice}>{t("loading")}</p>
        ) : load === "error" ? (
          <div className={styles.notice}>
            <p>{t("loadError")}</p>
            <button type="button" className={styles.ghost} onClick={() => void fetchPage(0)}>
              {t("retry")}
            </button>
          </div>
        ) : entries.length === 0 ? (
          <p className={styles.notice}>{t("empty")}</p>
        ) : (
          <>
            <p className={styles.count}>{t("count", { total })}</p>
            <ul className={styles.list}>
              {entries.map((entry) => (
                <li key={entry.id} className={styles.entry}>
                  <div className={styles.entryHead}>
                    <span className={styles.entryName}>{entry.name}</span>
                    <span className={styles.entryDate}>{formatDate(entry.createdAt, locale)}</span>
                  </div>
                  <p className={styles.entryMessage}>{entry.message}</p>
                  {mine.has(entry.id) && (
                    <button
                      type="button"
                      className={styles.delete}
                      onClick={() => void onDelete(entry.id)}
                    >
                      {t("delete")}
                    </button>
                  )}
                </li>
              ))}
            </ul>
            {hasMore && (
              <button
                type="button"
                className={styles.ghost}
                onClick={() => void fetchPage(entries.length)}
                disabled={load === "loadingMore"}
              >
                {load === "loadingMore" ? t("loading") : t("more")}
              </button>
            )}
          </>
        )}

        <form className={styles.form} onSubmit={onSubmit}>
          <input
            className={styles.input}
            placeholder={t("namePlaceholder")}
            aria-label={t("namePlaceholder")}
            maxLength={40}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <textarea
            className={styles.input}
            placeholder={t("messagePlaceholder")}
            aria-label={t("messagePlaceholder")}
            maxLength={1000}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <input
            className={styles.input}
            inputMode="numeric"
            placeholder={t("pinPlaceholder")}
            maxLength={4}
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
            aria-label={t("pinAria")}
          />
          {formError && <p className={styles.error}>{formError}</p>}
          <button type="submit" className={styles.submit} disabled={status === "sending"}>
            {status === "sending" ? t("submitting") : t("submit")}
          </button>
        </form>
      </Container>
    </section>
  );
}
