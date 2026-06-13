"use client";

import type { InvitationDesignFields } from "@yours-truly/shared";
import type { PanelProps } from "./types";
import styles from "../../../dashboard.module.scss";

type Reception = NonNullable<InvitationDesignFields["reception"]>;

// Reception time is Korean wall-clock, like the main ceremony field: convert
// the datetime-local value against a fixed +09:00, not the browser timezone.
const KST = 9 * 60 * 60 * 1000;
function isoToLocal(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const k = new Date(d.getTime() + KST);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${k.getUTCFullYear()}-${p(k.getUTCMonth() + 1)}-${p(k.getUTCDate())}T${p(k.getUTCHours())}:${p(k.getUTCMinutes())}`;
}
function localToIso(v: string): string | undefined {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(v);
  if (!m) return undefined;
  const [, y, mo, d, h, mi] = m;
  return new Date(Date.UTC(Number(y), Number(mo) - 1, Number(d), Number(h), Number(mi)) - KST).toISOString();
}

/** 피로연 안내 — a separate reception block (place/time/note). */
export function ReceptionPanel({ value, onChange }: PanelProps<Reception>) {
  const r = value ?? {};
  function update(patch: Partial<Reception>) {
    const next = { ...r, ...patch };
    const keep = next.dateTime || next.venue?.trim() || next.address?.trim() || next.note?.trim();
    onChange(keep ? next : undefined);
  }
  return (
    <div>
      <label className={styles.field}>
        <span>장소</span>
        <input value={r.venue ?? ""} onChange={(e) => update({ venue: e.target.value })} />
      </label>
      <label className={styles.field}>
        <span>주소</span>
        <input value={r.address ?? ""} onChange={(e) => update({ address: e.target.value })} />
      </label>
      <label className={styles.field}>
        <span>일시 (한국 시간)</span>
        <input
          type="datetime-local"
          value={isoToLocal(r.dateTime)}
          onChange={(e) => update({ dateTime: localToIso(e.target.value) })}
        />
      </label>
      <label className={styles.field}>
        <span>안내</span>
        <textarea value={r.note ?? ""} onChange={(e) => update({ note: e.target.value })} />
      </label>
    </div>
  );
}
