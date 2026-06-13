"use client";

import type { InvitationDesignFields } from "@yours-truly/shared";
import { ImageField } from "./ImageField";
import type { ImageUploader, PanelProps } from "./types";
import styles from "../../../dashboard.module.scss";

type Timeline = NonNullable<InvitationDesignFields["timeline"]>;

/** 우리의 이야기 — dated milestones with an optional photo each. */
export function TimelinePanel({ value, onChange, upload }: PanelProps<Timeline> & { upload: ImageUploader }) {
  const rows: Timeline = value ?? [];
  function update(i: number, patch: Partial<Timeline[number]>) {
    onChange(rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }
  function remove(i: number) {
    const next = rows.filter((_, idx) => idx !== i);
    onChange(next.length ? next : undefined);
  }
  return (
    <div>
      {rows.map((row, i) => (
        <div key={i} className={styles.rowCard}>
          <div className={styles.rowHead}>
            <span>타임라인 {i + 1}</span>
            <button type="button" className={styles.removeRow} onClick={() => remove(i)}>
              삭제
            </button>
          </div>
          <div className={styles.fieldRow}>
            <label className={styles.field}>
              <span>시점</span>
              <input value={row.date ?? ""} placeholder="2021" onChange={(e) => update(i, { date: e.target.value })} />
            </label>
            <label className={styles.field}>
              <span>제목</span>
              <input value={row.label ?? ""} onChange={(e) => update(i, { label: e.target.value })} />
            </label>
          </div>
          <label className={styles.field}>
            <span>내용</span>
            <textarea value={row.text ?? ""} onChange={(e) => update(i, { text: e.target.value })} />
          </label>
          <ImageField value={row.imageKey} onChange={(k) => update(i, { imageKey: k })} upload={upload} />
        </div>
      ))}
      <button type="button" className={styles.addRow} onClick={() => onChange([...rows, {}])}>
        + 타임라인 추가
      </button>
    </div>
  );
}
