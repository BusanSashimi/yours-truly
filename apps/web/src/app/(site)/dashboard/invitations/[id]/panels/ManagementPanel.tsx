"use client";

import { useEffect, useState } from "react";
import type { GuestMessage, GuestUploadEntry, GuestbookEntry, RsvpEntry } from "@yours-truly/shared";
import {
  deleteGuestMessage,
  deleteGuestUpload,
  deleteGuestbookEntry,
  deleteRsvp,
  getGuestMessages,
  getGuestUploads,
  getGuestbook,
  getRsvps,
} from "@/lib/api";
import { assetUrl } from "@/lib/assets";
import styles from "../../../dashboard.module.scss";

/** Owner views for the dynamic guest features: list + delete RSVPs, guestbook, uploads. */
export function ManagementPanel({ invitationId }: { invitationId: string }) {
  const [rsvps, setRsvps] = useState<RsvpEntry[] | null>(null);
  const [guestbook, setGuestbook] = useState<GuestbookEntry[] | null>(null);
  const [uploads, setUploads] = useState<GuestUploadEntry[] | null>(null);
  const [messages, setMessages] = useState<GuestMessage[] | null>(null);

  useEffect(() => {
    let active = true;
    getRsvps(invitationId).then((r) => active && setRsvps(r.responses)).catch(() => active && setRsvps([]));
    getGuestbook(invitationId, { limit: 100 }).then((r) => active && setGuestbook(r.entries)).catch(() => active && setGuestbook([]));
    getGuestUploads(invitationId).then((r) => active && setUploads(r.uploads)).catch(() => active && setUploads([]));
    getGuestMessages(invitationId).then((r) => active && setMessages(r.messages)).catch(() => active && setMessages([]));
    return () => {
      active = false;
    };
  }, [invitationId]);

  async function removeRsvp(id: string) {
    await deleteRsvp(invitationId, id);
    setRsvps((p) => p?.filter((x) => x.id !== id) ?? null);
  }
  async function removeGuestbook(id: string) {
    await deleteGuestbookEntry(invitationId, id);
    setGuestbook((p) => p?.filter((x) => x.id !== id) ?? null);
  }
  async function removeUpload(id: string) {
    await deleteGuestUpload(invitationId, id);
    setUploads((p) => p?.filter((x) => x.id !== id) ?? null);
  }
  async function removeMessage(id: string) {
    await deleteGuestMessage(invitationId, id);
    setMessages((p) => p?.filter((x) => x.id !== id) ?? null);
  }

  return (
    <div>
      <div className={styles.rowHead}>
        <span>참석 여부 (RSVP) · {rsvps?.length ?? "…"}</span>
      </div>
      <ul className={styles.mgmtList}>
        {rsvps?.map((r) => (
          <li key={r.id} className={styles.mgmtItem}>
            <div>
              <strong>{r.name}</strong> · {r.attendance === "yes" ? "참석" : "불참"}
              {r.headcount ? ` · ${r.headcount}명` : ""}
              <div className={styles.mgmtMeta}>
                {[r.side === "groom" ? "신랑측" : r.side === "bride" ? "신부측" : "", r.phone, r.message]
                  .filter(Boolean)
                  .join(" · ")}
              </div>
            </div>
            <button type="button" className={styles.removeRow} onClick={() => void removeRsvp(r.id)}>
              삭제
            </button>
          </li>
        ))}
      </ul>
      {rsvps?.length === 0 && <p className={styles.empty}>아직 응답이 없어요.</p>}

      <div className={styles.rowHead} style={{ marginTop: 20 }}>
        <span>방명록 · {guestbook?.length ?? "…"}</span>
      </div>
      <ul className={styles.mgmtList}>
        {guestbook?.map((g) => (
          <li key={g.id} className={styles.mgmtItem}>
            <div>
              <strong>{g.name}</strong>
              <div className={styles.mgmtMeta}>{g.message}</div>
            </div>
            <button type="button" className={styles.removeRow} onClick={() => void removeGuestbook(g.id)}>
              삭제
            </button>
          </li>
        ))}
      </ul>
      {guestbook?.length === 0 && <p className={styles.empty}>아직 방명록이 없어요.</p>}

      <div className={styles.rowHead} style={{ marginTop: 20 }}>
        <span>게스트 스냅 · {uploads?.length ?? "…"}</span>
      </div>
      <div className={styles.imgRow}>
        {uploads?.map((u) => (
          <span key={u.id} className={styles.imgThumb}>
            {/* eslint-disable-next-line @next/next/no-img-element -- editor thumbnail */}
            <img src={assetUrl(u.key)} alt="" />
            <button type="button" onClick={() => void removeUpload(u.id)} aria-label="삭제">
              ×
            </button>
          </span>
        ))}
      </div>
      {uploads?.length === 0 && <p className={styles.empty}>아직 올라온 사진이 없어요.</p>}

      <div className={styles.rowHead} style={{ marginTop: 20 }}>
        <span>받은 메시지 (비공개) · {messages?.length ?? "…"}</span>
      </div>
      <ul className={styles.mgmtList}>
        {messages?.map((m) => (
          <li key={m.id} className={styles.mgmtItem}>
            <div>
              {m.senderName && <strong>{m.senderName}</strong>}
              {m.message && <div className={styles.mgmtMeta}>{m.message}</div>}
              {m.photos.length > 0 && (
                <div className={styles.msgPhotos}>
                  {m.photos.map((p) => (
                    <span key={p.key}>
                      {/* eslint-disable-next-line @next/next/no-img-element -- presigned private thumbnail */}
                      <img src={p.url} alt="" className={styles.msgPhoto} />
                    </span>
                  ))}
                </div>
              )}
            </div>
            <button type="button" className={styles.removeRow} onClick={() => void removeMessage(m.id)}>
              삭제
            </button>
          </li>
        ))}
      </ul>
      {messages?.length === 0 && <p className={styles.empty}>아직 받은 메시지가 없어요.</p>}
    </div>
  );
}
