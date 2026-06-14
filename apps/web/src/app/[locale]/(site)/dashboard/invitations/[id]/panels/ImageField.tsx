"use client";

import { useState } from "react";
import { assetUrl } from "@/lib/assets";
import type { ImageUploader } from "./types";
import styles from "../../../dashboard.module.scss";

/** A single-image control: thumbnail + remove when set, else an upload button. */
export function ImageField({
  value,
  onChange,
  upload,
}: {
  value: string | undefined;
  onChange: (key: string | undefined) => void;
  upload: ImageUploader;
}) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function pick(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setErr(null);
    try {
      onChange(await upload(file));
    } catch (e) {
      setErr(e instanceof Error ? e.message : "업로드에 실패했습니다.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={styles.imgRow}>
      {value ? (
        <span className={styles.imgThumb}>
          {/* eslint-disable-next-line @next/next/no-img-element -- editor thumbnail */}
          <img src={assetUrl(value)} alt="" />
          <button type="button" onClick={() => onChange(undefined)} aria-label="사진 삭제">
            ×
          </button>
        </span>
      ) : (
        <label className={styles.addImg}>
          {busy ? "…" : "+"}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic"
            disabled={busy}
            onChange={(e) => {
              void pick(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
        </label>
      )}
      {err && <p className={styles.error}>{err}</p>}
    </div>
  );
}
