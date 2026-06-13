"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
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

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) {
      setFormError("성함을 입력해 주세요.");
      return;
    }
    if (!message.trim()) {
      setFormError("내용을 입력해 주세요.");
      return;
    }
    if (pin && !/^\d{4}$/.test(pin)) {
      setFormError("PIN은 숫자 4자리로 입력해 주세요.");
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
      setFormError(e instanceof Error ? e.message : "등록에 실패했습니다.");
    } finally {
      setStatus("idle");
    }
  }

  async function onDelete(id: string) {
    const entered = window.prompt("작성 시 입력한 PIN 4자리를 입력해 주세요.");
    if (entered == null) return;
    if (!/^\d{4}$/.test(entered)) {
      window.alert("PIN은 숫자 4자리입니다.");
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
      window.alert(e instanceof Error ? e.message : "삭제에 실패했습니다.");
    }
  }

  const hasMore = entries.length < total;

  return (
    <section className={styles.section}>
      <Container>
        <Eyebrow>Guestbook</Eyebrow>
        <SectionTitle>방명록</SectionTitle>

        {load === "loading" ? (
          <p className={styles.notice}>불러오는 중…</p>
        ) : load === "error" ? (
          <div className={styles.notice}>
            <p>방명록을 불러오지 못했습니다.</p>
            <button type="button" className={styles.ghost} onClick={() => void fetchPage(0)}>
              다시 시도
            </button>
          </div>
        ) : entries.length === 0 ? (
          <p className={styles.notice}>아직 작성된 방명록이 없습니다.</p>
        ) : (
          <>
            <p className={styles.count}>총 {total}개의 메시지</p>
            <ul className={styles.list}>
              {entries.map((entry) => (
                <li key={entry.id} className={styles.entry}>
                  <div className={styles.entryHead}>
                    <span className={styles.entryName}>{entry.name}</span>
                    <span className={styles.entryDate}>{formatDate(entry.createdAt)}</span>
                  </div>
                  <p className={styles.entryMessage}>{entry.message}</p>
                  {mine.has(entry.id) && (
                    <button
                      type="button"
                      className={styles.delete}
                      onClick={() => void onDelete(entry.id)}
                    >
                      삭제
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
                {load === "loadingMore" ? "불러오는 중…" : "더보기"}
              </button>
            )}
          </>
        )}

        <form className={styles.form} onSubmit={onSubmit}>
          <input
            className={styles.input}
            placeholder="성함"
            maxLength={40}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <textarea
            className={styles.input}
            placeholder="축하의 메시지를 남겨 주세요"
            maxLength={1000}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <input
            className={styles.input}
            inputMode="numeric"
            placeholder="PIN 4자리 (선택, 삭제 시 필요)"
            maxLength={4}
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
            aria-label="삭제용 PIN 4자리 (선택)"
          />
          {formError && <p className={styles.error}>{formError}</p>}
          <button type="submit" className={styles.submit} disabled={status === "sending"}>
            {status === "sending" ? "등록 중…" : "방명록 남기기"}
          </button>
        </form>
      </Container>
    </section>
  );
}
