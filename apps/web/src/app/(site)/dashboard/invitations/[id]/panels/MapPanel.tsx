"use client";

import type { InvitationDesignFields } from "@yours-truly/shared";
import type { PanelProps } from "./types";
import styles from "../../../dashboard.module.scss";

type MapInfo = NonNullable<InvitationDesignFields["map"]>;

/**
 * 오시는 길 (지도 링크) — navigation deep links. URL fields store `undefined`
 * when blank (the schema validates them as URLs, so an empty string would be
 * rejected and drop the whole slice).
 */
export function MapPanel({ value, onChange }: PanelProps<MapInfo>) {
  const m = value ?? {};
  function update(patch: Partial<Record<"naverUrl" | "kakaoUrl" | "tmapUrl", string>>) {
    const merged = { ...m, ...patch };
    const next: MapInfo = {
      naverUrl: merged.naverUrl?.trim() || undefined,
      kakaoUrl: merged.kakaoUrl?.trim() || undefined,
      tmapUrl: merged.tmapUrl?.trim() || undefined,
    };
    onChange(next.naverUrl || next.kakaoUrl || next.tmapUrl ? next : undefined);
  }
  return (
    <div>
      <label className={styles.field}>
        <span>네이버지도 링크</span>
        <input
          value={m.naverUrl ?? ""}
          placeholder="https://map.naver.com/..."
          onChange={(e) => update({ naverUrl: e.target.value })}
        />
      </label>
      <label className={styles.field}>
        <span>카카오맵 링크</span>
        <input value={m.kakaoUrl ?? ""} onChange={(e) => update({ kakaoUrl: e.target.value })} />
      </label>
      <label className={styles.field}>
        <span>티맵 링크</span>
        <input value={m.tmapUrl ?? ""} onChange={(e) => update({ tmapUrl: e.target.value })} />
      </label>
    </div>
  );
}
