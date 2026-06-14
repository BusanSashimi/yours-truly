"use client";

import type { InvitationDesignFields } from "@yours-truly/shared";
import type { PanelProps } from "./types";
import styles from "../../../dashboard.module.scss";

type Parents = NonNullable<InvitationDesignFields["parents"]>;
type Parent = NonNullable<Parents["groomFather"]>;

const SLOTS: { key: keyof Parents; label: string }[] = [
  { key: "groomFather", label: "신랑 아버지" },
  { key: "groomMother", label: "신랑 어머니" },
  { key: "brideFather", label: "신부 아버지" },
  { key: "brideMother", label: "신부 어머니" },
];

/** 혼주 — the four parents, each with an optional 고인(故) marker and phone. */
export function ParentsPanel({ value, onChange }: PanelProps<Parents>) {
  const parents: Parents = value ?? {};
  function update(key: keyof Parents, patch: Partial<Parent>) {
    const merged: Parent = { ...parents[key], ...patch };
    const keep = merged.name?.trim() || merged.phone?.trim() || merged.deceased;
    const next: Parents = { ...parents, [key]: keep ? merged : undefined };
    onChange(SLOTS.some((s) => next[s.key]) ? next : undefined);
  }
  return (
    <div>
      {SLOTS.map((slot) => {
        const p = parents[slot.key] ?? {};
        return (
          <div key={slot.key} className={styles.rowCard}>
            <div className={styles.rowHead}>
              <span>{slot.label}</span>
            </div>
            <div className={styles.fieldRow}>
              <label className={styles.field}>
                <span>이름</span>
                <input value={p.name ?? ""} onChange={(e) => update(slot.key, { name: e.target.value })} />
              </label>
              <label className={styles.field}>
                <span>전화번호</span>
                <input value={p.phone ?? ""} onChange={(e) => update(slot.key, { phone: e.target.value })} />
              </label>
            </div>
            <label className={styles.toggleRow}>
              <span>고인 (故)</span>
              <input
                type="checkbox"
                checked={Boolean(p.deceased)}
                onChange={(e) => update(slot.key, { deceased: e.target.checked })}
              />
            </label>
          </div>
        );
      })}
    </div>
  );
}
