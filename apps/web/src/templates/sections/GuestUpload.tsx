"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { useLocale, useTranslations } from "next-intl";
import type { GuestUploadEntry, InvitationDesignFields } from "@yours-truly/shared";
import { confirmGuestUpload, getGuestUploads, presignGuestUpload } from "@/lib/api";
import { assetUrl } from "@/lib/assets";
import { ImageError, reencodeToJpeg } from "@/lib/image-processing";
import { formatDate } from "../format";
import { Container, Eyebrow, SectionTitle } from "../theme";
import styles from "./GuestUpload.module.scss";

/**
 * Guest photo upload (게스트스냅) — a client island. Guests re-encode a photo
 * client-side (EXIF stripped, bounded size), upload it to a presigned URL, then
 * confirm it; confirmed uploads prepend to the live grid. Gated by
 * `settings.openDate`: before that instant the uploader is replaced by a notice.
 * The "now" comparison and the on-mount fetch run after hydration to avoid
 * SSR mismatches. Renders nothing when the feature is disabled.
 */
export function GuestUpload({
  invitationId,
  settings,
}: {
  invitationId: string;
  settings?: InvitationDesignFields["guestUpload"];
}) {
  const [nowMs, setNowMs] = useState<number | null>(null);
  const [uploads, setUploads] = useState<GuestUploadEntry[]>([]);
  const [listState, setListState] = useState<"loading" | "ready" | "error">("loading");
  const [uploaderName, setUploaderName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setNowMs(Date.now());
  }, []);

  useEffect(() => {
    if (!settings?.enabled) return;
    let active = true;
    getGuestUploads(invitationId)
      .then((res) => {
        if (!active) return;
        setUploads(res.uploads);
        setListState("ready");
      })
      .catch(() => {
        if (active) setListState("error");
      });
    return () => {
      active = false;
    };
  }, [invitationId, settings?.enabled]);

  const t = useTranslations("Invitation.GuestUpload");
  const tImg = useTranslations("Errors.image");
  const locale = useLocale();

  if (!settings?.enabled) return null;

  // Until mounted we don't know the real time, so withhold the open/closed
  // decision rather than guessing and flipping after hydration.
  const mounted = nowMs !== null;
  const isOpen =
    mounted &&
    (!settings.openDate || new Date(settings.openDate).getTime() <= nowMs);

  async function onFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (fileRef.current) fileRef.current.value = "";
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const blob = await reencodeToJpeg(file);
      const trimmedName = uploaderName.trim();
      const { uploadUrl, key } = await presignGuestUpload(invitationId, {
        contentType: "image/jpeg",
        size: blob.size,
        ...(trimmedName ? { uploaderName: trimmedName } : {}),
      });
      const put = await fetch(uploadUrl, {
        method: "PUT",
        body: blob,
        headers: { "Content-Type": "image/jpeg" },
      });
      if (!put.ok) throw new Error(t("uploadErrorStatus", { status: put.status }));
      const entry = await confirmGuestUpload(invitationId, {
        key,
        ...(trimmedName ? { uploaderName: trimmedName } : {}),
      });
      setUploads((prev) => [entry, ...prev]);
    } catch (e) {
      if (e instanceof ImageError) setError(tImg(e.code));
      else setError(e instanceof Error ? e.message : t("uploadError"));
    } finally {
      setUploading(false);
    }
  }

  return (
    <section className={styles.section}>
      <Container>
        <Eyebrow>Guest Snap</Eyebrow>
        <SectionTitle>{t("title")}</SectionTitle>
        {settings.prompt && <p className={styles.prompt}>{settings.prompt}</p>}

        {mounted && !isOpen && settings.openDate && (
          <p className={styles.notice}>
            {t("openNotice", { date: formatDate(settings.openDate, locale) })}
          </p>
        )}

        {isOpen && (
          <div className={styles.uploader}>
            <input
              className={styles.input}
              placeholder={t("namePlaceholder")}
              value={uploaderName}
              maxLength={40}
              onChange={(e) => setUploaderName(e.target.value)}
              disabled={uploading}
            />
            <input
              ref={fileRef}
              id="guest-upload-file"
              className={styles.fileInput}
              type="file"
              accept="image/*"
              onChange={onFile}
              disabled={uploading}
            />
            <label htmlFor="guest-upload-file" className={styles.uploadButton} aria-disabled={uploading}>
              {uploading ? t("uploading") : t("uploadButton")}
            </label>
            {error && <p className={styles.error}>{error}</p>}
          </div>
        )}
      </Container>

      {listState === "error" ? (
        <Container>
          <p className={styles.notice}>{t("loadError")}</p>
        </Container>
      ) : listState === "loading" ? (
        <Container>
          <p className={styles.notice}>{t("loading")}</p>
        </Container>
      ) : uploads.length === 0 ? (
        <Container>
          <p className={styles.notice}>{t("empty")}</p>
        </Container>
      ) : (
        <div className={styles.grid}>
          {uploads.map((upload) => (
            <figure key={upload.id} className={styles.cell}>
              <Image
                src={assetUrl(upload.key)}
                alt={upload.uploaderName ? t("photoAlt", { name: upload.uploaderName }) : ""}
                fill
                sizes="(max-width: 480px) 50vw, 240px"
                className={styles.img}
              />
              {upload.uploaderName && (
                <figcaption className={styles.caption}>{upload.uploaderName}</figcaption>
              )}
            </figure>
          ))}
        </div>
      )}
    </section>
  );
}
