"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { useLocale, useTranslations } from "next-intl";
import { GUEST_MESSAGE_MAX_PHOTOS } from "@yours-truly/shared";
import { createGuestMessage, presignGuestMessageUpload } from "@/lib/api";
import { ImageError, reencodeToJpeg } from "@/lib/image-processing";
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

  const t = useTranslations("Send");
  const tImg = useTranslations("Errors.image");
  const locale = useLocale();

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
      setError(t("photoLimit", { max: GUEST_MESSAGE_MAX_PHOTOS }));
      return;
    }
    const accepted = chosen.slice(0, room).map((file) => ({
      id: `p${idRef.current++}`,
      file,
      previewUrl: URL.createObjectURL(file),
    }));
    if (chosen.length > room) {
      setError(t("photoLimit", { max: GUEST_MESSAGE_MAX_PHOTOS }));
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
      setError(t("needContent"));
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
        if (!put.ok) throw new Error(t("photoUploadError", { status: put.status }));
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
      if (e instanceof ImageError) setError(tImg(e.code));
      else setError(e instanceof Error ? e.message : t("sendError"));
    } finally {
      setSubmitting(false);
      setProgress(null);
    }
  }

  if (done) {
    return (
      <div className={styles.done}>
        <p className={styles.doneEmoji}>💌</p>
        <h2 className={styles.doneTitle}>{t("doneTitle")}</h2>
        <p className={styles.doneText}>{t("doneText")}</p>
      </div>
    );
  }

  if (!isOpen) {
    return (
      <p className={styles.notice}>
        {openDate
          ? t("openNotice", { date: formatOpenDate(openDate, locale) })
          : t("closedNotice")}
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
        placeholder={t("namePlaceholder")}
        value={senderName}
        maxLength={40}
        onChange={(e) => setSenderName(e.target.value)}
        disabled={submitting}
      />
      <textarea
        className={styles.textarea}
        placeholder={t("messagePlaceholder")}
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
                aria-label={t("removePhoto")}
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
        {t("addPhotos", { count: photos.length, max: GUEST_MESSAGE_MAX_PHOTOS })}
      </label>

      {error && <p className={styles.error}>{error}</p>}

      <button type="submit" className={styles.submit} disabled={submitting}>
        {submitting
          ? progress && progress.total > 0
            ? t("sendingProgress", { done: progress.done, total: progress.total })
            : t("sending")
          : t("submit")}
      </button>
    </form>
  );
}

function formatOpenDate(iso: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Asia/Seoul",
  }).format(new Date(iso));
}
