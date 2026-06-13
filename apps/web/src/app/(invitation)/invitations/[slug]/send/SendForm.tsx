"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { GUEST_MESSAGE_MAX_PHOTOS } from "@yours-truly/shared";
import { createGuestMessage, presignGuestMessageUpload } from "@/lib/api";
import { reencodeToJpeg } from "@/lib/image-processing";
import styles from "./send.module.scss";

type Picked = { id: string; file: File; previewUrl: string };

/**
 * Guest message composer (QR 메시지·사진) — a client island. The guest writes an
 * optional name + message and attaches up to GUEST_MESSAGE_MAX_PHOTOS photos.
 * On submit each photo is re-encoded (EXIF stripped, bounded), PUT to a
 * presigned URL under the private `m/` prefix, then the message is created with
 * the collected keys. Photos never display publicly — they go only to the
 * couple's inbox. The openDate gate is evaluated after mount (like GuestUpload)
 * to avoid an SSR/ISR time mismatch; the API re-checks it on submit regardless.
 */
export function SendForm({
  invitationId,
  openDate,
}: {
  invitationId: string;
  openDate?: string;
}) {
  const [nowMs, setNowMs] = useState<number | null>(null);
  const [senderName, setSenderName] = useState("");
  const [message, setMessage] = useState("");
  const [photos, setPhotos] = useState<Picked[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const idRef = useRef(0);

  useEffect(() => setNowMs(Date.now()), []);

  // Revoke any outstanding object URLs when the form unmounts.
  const photosRef = useRef<Picked[]>([]);
  useEffect(() => {
    photosRef.current = photos;
  }, [photos]);
  useEffect(
    () => () => {
      photosRef.current.forEach((p) => URL.revokeObjectURL(p.previewUrl));
    },
    [],
  );

  const mounted = nowMs !== null;
  const isOpen = mounted && (!openDate || new Date(openDate).getTime() <= nowMs);
  const full = photos.length >= GUEST_MESSAGE_MAX_PHOTOS;

  function addFiles(event: ChangeEvent<HTMLInputElement>) {
    const chosen = Array.from(event.target.files ?? []);
    if (fileRef.current) fileRef.current.value = "";
    if (chosen.length === 0) return;
    setError(null);
    const room = GUEST_MESSAGE_MAX_PHOTOS - photos.length;
    if (room <= 0) {
      setError(`사진은 최대 ${GUEST_MESSAGE_MAX_PHOTOS}장까지 첨부할 수 있어요.`);
      return;
    }
    const accepted = chosen.slice(0, room).map((file) => ({
      id: `p${idRef.current++}`,
      file,
      previewUrl: URL.createObjectURL(file),
    }));
    if (chosen.length > room) {
      setError(`사진은 최대 ${GUEST_MESSAGE_MAX_PHOTOS}장까지 첨부할 수 있어요.`);
    }
    setPhotos((prev) => [...prev, ...accepted]);
  }

  function removePhoto(id: string) {
    setPhotos((prev) => {
      const target = prev.find((p) => p.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((p) => p.id !== id);
    });
  }

  async function onSubmit() {
    const trimmedMessage = message.trim();
    const trimmedName = senderName.trim();
    if (!trimmedMessage && photos.length === 0) {
      setError("메시지를 입력하거나 사진을 첨부해 주세요.");
      return;
    }
    setError(null);
    setSubmitting(true);
    setProgress({ done: 0, total: photos.length });
    try {
      const photoKeys: string[] = [];
      for (const [i, photo] of photos.entries()) {
        const blob = await reencodeToJpeg(photo.file);
        const { uploadUrl, key } = await presignGuestMessageUpload(invitationId, {
          contentType: "image/jpeg",
          size: blob.size,
        });
        const put = await fetch(uploadUrl, {
          method: "PUT",
          body: blob,
          headers: { "Content-Type": "image/jpeg" },
        });
        if (!put.ok) throw new Error(`사진 업로드에 실패했습니다 (${put.status})`);
        photoKeys.push(key);
        setProgress({ done: i + 1, total: photos.length });
      }
      await createGuestMessage(invitationId, {
        ...(trimmedName ? { senderName: trimmedName } : {}),
        ...(trimmedMessage ? { message: trimmedMessage } : {}),
        photoKeys,
      });
      photos.forEach((p) => URL.revokeObjectURL(p.previewUrl));
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "전송에 실패했습니다.");
    } finally {
      setSubmitting(false);
      setProgress(null);
    }
  }

  if (done) {
    return (
      <div className={styles.done}>
        <p className={styles.doneEmoji}>💌</p>
        <h2 className={styles.doneTitle}>마음이 전달되었어요</h2>
        <p className={styles.doneText}>소중한 메시지 감사합니다.</p>
      </div>
    );
  }

  if (!isOpen) {
    return (
      <p className={styles.notice}>
        {openDate
          ? `${formatOpenDate(openDate)}부터 메시지를 받아요.`
          : "지금은 메시지를 받지 않아요."}
      </p>
    );
  }

  return (
    <form
      className={styles.form}
      onSubmit={(e) => {
        e.preventDefault();
        if (!submitting) onSubmit();
      }}
    >
      <input
        className={styles.input}
        placeholder="이름 (선택)"
        value={senderName}
        maxLength={40}
        onChange={(e) => setSenderName(e.target.value)}
        disabled={submitting}
      />
      <textarea
        className={styles.textarea}
        placeholder="신랑·신부에게 전하고 싶은 말을 남겨주세요"
        value={message}
        maxLength={1000}
        rows={5}
        onChange={(e) => setMessage(e.target.value)}
        disabled={submitting}
      />

      {photos.length > 0 && (
        <ul className={styles.thumbs}>
          {photos.map((p) => (
            <li key={p.id} className={styles.thumb}>
              {/* Local object-URL preview (never uploaded as-is; re-encoded on submit). */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.previewUrl} alt="" className={styles.thumbImg} />
              <button
                type="button"
                className={styles.thumbRemove}
                onClick={() => removePhoto(p.id)}
                disabled={submitting}
                aria-label="사진 삭제"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      <input
        ref={fileRef}
        id="send-photos"
        className={styles.fileInput}
        type="file"
        accept="image/*"
        multiple
        onChange={addFiles}
        disabled={submitting || full}
      />
      <label
        htmlFor="send-photos"
        className={styles.addPhotos}
        aria-disabled={submitting || full}
      >
        사진 첨부 ({photos.length}/{GUEST_MESSAGE_MAX_PHOTOS})
      </label>

      {error && <p className={styles.error}>{error}</p>}

      <button type="submit" className={styles.submit} disabled={submitting}>
        {submitting
          ? progress && progress.total > 0
            ? `전송 중… (${progress.done}/${progress.total})`
            : "전송 중…"
          : "마음 전하기"}
      </button>
    </form>
  );
}

function formatOpenDate(iso: string): string {
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Asia/Seoul",
  }).format(new Date(iso));
}
