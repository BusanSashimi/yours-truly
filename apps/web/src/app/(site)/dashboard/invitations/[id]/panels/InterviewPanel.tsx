"use client";

import type { InvitationDesignFields } from "@yours-truly/shared";
import type { PanelProps } from "./types";
import styles from "../../../dashboard.module.scss";

type Interview = NonNullable<InvitationDesignFields["interview"]>;

/** 웨딩 인터뷰 — Q&A rows with per-person answers. */
export function InterviewPanel({ value, onChange }: PanelProps<Interview>) {
  const rows: Interview = value ?? [];
  function update(i: number, patch: Partial<Interview[number]>) {
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
            <span>질문 {i + 1}</span>
            <button type="button" className={styles.removeRow} onClick={() => remove(i)}>
              삭제
            </button>
          </div>
          <label className={styles.field}>
            <span>질문</span>
            <input value={row.question ?? ""} onChange={(e) => update(i, { question: e.target.value })} />
          </label>
          <label className={styles.field}>
            <span>신랑 답변</span>
            <textarea value={row.groomAnswer ?? ""} onChange={(e) => update(i, { groomAnswer: e.target.value })} />
          </label>
          <label className={styles.field}>
            <span>신부 답변</span>
            <textarea value={row.brideAnswer ?? ""} onChange={(e) => update(i, { brideAnswer: e.target.value })} />
          </label>
        </div>
      ))}
      <button type="button" className={styles.addRow} onClick={() => onChange([...rows, { question: "" }])}>
        + 질문 추가
      </button>
    </div>
  );
}
