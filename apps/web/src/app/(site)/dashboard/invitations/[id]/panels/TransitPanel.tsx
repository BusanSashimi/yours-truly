"use client";

import type { InvitationDesignFields } from "@yours-truly/shared";
import type { PanelProps } from "./types";
import styles from "../../../dashboard.module.scss";

type Transit = NonNullable<InvitationDesignFields["transit"]>;

const FIELDS: { key: keyof Transit; label: string }[] = [
  { key: "bus", label: "버스" },
  { key: "subway", label: "지하철" },
  { key: "car", label: "자가용" },
  { key: "parking", label: "주차" },
  { key: "shuttle", label: "셔틀버스" },
];

/** 교통편 안내 — free-text directions per mode. */
export function TransitPanel({ value, onChange }: PanelProps<Transit>) {
  const t = value ?? {};
  function update(key: keyof Transit, text: string) {
    const merged = { ...t, [key]: text };
    const next: Transit = {};
    for (const { key: k } of FIELDS) {
      const v = merged[k]?.trim();
      if (v) next[k] = v;
    }
    onChange(Object.keys(next).length ? next : undefined);
  }
  return (
    <div>
      {FIELDS.map(({ key, label }) => (
        <label key={key} className={styles.field}>
          <span>{label}</span>
          <textarea value={t[key] ?? ""} onChange={(e) => update(key, e.target.value)} />
        </label>
      ))}
    </div>
  );
}
