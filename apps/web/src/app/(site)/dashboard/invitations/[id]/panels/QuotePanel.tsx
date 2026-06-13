"use client";

import type { InvitationDesignFields } from "@yours-truly/shared";
import type { PanelProps } from "./types";
import styles from "../../../dashboard.module.scss";

type Quote = NonNullable<InvitationDesignFields["quote"]>;

/** 인용구 — a decorative epigraph (text + source). */
export function QuotePanel({ value, onChange }: PanelProps<Quote>) {
  const q = value ?? {};
  function update(patch: Partial<Quote>) {
    const next = { ...q, ...patch };
    onChange(next.text?.trim() || next.source?.trim() ? next : undefined);
  }
  return (
    <div>
      <label className={styles.field}>
        <span>인용구</span>
        <textarea value={q.text ?? ""} onChange={(e) => update({ text: e.target.value })} />
      </label>
      <label className={styles.field}>
        <span>출처</span>
        <input value={q.source ?? ""} onChange={(e) => update({ source: e.target.value })} />
      </label>
    </div>
  );
}
