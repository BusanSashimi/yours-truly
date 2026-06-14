"use client";

import { useState } from "react";
import { assetUrl } from "@/lib/assets";
import type { ImageUploader, PanelProps } from "./types";
import styles from "../../../dashboard.module.scss";

/** A reorderable-free image list (gallery, closing photos): add via upload, remove. */
export function GalleryPanel({
  value,
  onChange,
  upload,
}: PanelProps<string[]> & { upload: ImageUploader }) {
  const keys = value ?? [];
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function add(files: FileList | null) {
    if (!files || files.length === 0) return;
    setBusy(true);
    setErr(null);
    try {
      const added: string[] = [];
      for (const file of Array.from(files)) added.push(await upload(file));
      onChange([...keys, ...added]);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "업로드에 실패했습니다.");
    } finally {
      setBusy(false);
    }
  }

  function remove(i: number) {
    const next = keys.filter((_, idx) => idx !== i);
    onChange(next.length ? next : undefined);
  }

  return (
    <div>
      <div className={styles.imgRow}>
        {keys.map((key, i) => (
          <span key={`${key}-${i}`} className={styles.imgThumb}>
            {/* eslint-disable-next-line @next/next/no-img-element -- editor thumbnail */}
            <img src={assetUrl(key)} alt="" />
            <button type="button" onClick={() => remove(i)} aria-label="사진 삭제">
              ×
            </button>
          </span>
        ))}
        <label className={styles.addImg}>
          {busy ? "…" : "+"}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic"
            multiple
            disabled={busy}
            onChange={(e) => {
              void add(e.target.files);
              e.target.value = "";
            }}
          />
        </label>
      </div>
      {err && <p className={styles.error}>{err}</p>}
    </div>
  );
}
