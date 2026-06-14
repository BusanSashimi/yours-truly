"use client";

import type { InvitationDesignFields } from "@yours-truly/shared";
import type { PanelProps } from "./types";
import styles from "../../../dashboard.module.scss";

type Contacts = NonNullable<InvitationDesignFields["contacts"]>;

/** 연락처 — an editable list of labelled phone contacts (혼주에게 연락하기). */
export function ContactsPanel({ value, onChange }: PanelProps<Contacts>) {
  const rows: Contacts = value ?? [];

  function update(i: number, patch: Partial<Contacts[number]>) {
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
            <span>연락처 {i + 1}</span>
            <button type="button" className={styles.removeRow} onClick={() => remove(i)}>
              삭제
            </button>
          </div>
          <div className={styles.fieldRow}>
            <label className={styles.field}>
              <span>관계</span>
              <input
                value={row.label ?? ""}
                placeholder="신랑 / 신랑 아버지"
                onChange={(e) => update(i, { label: e.target.value })}
              />
            </label>
            <label className={styles.field}>
              <span>이름</span>
              <input value={row.name ?? ""} onChange={(e) => update(i, { name: e.target.value })} />
            </label>
          </div>
          <label className={styles.field}>
            <span>전화번호</span>
            <input
              value={row.phone ?? ""}
              placeholder="010-0000-0000"
              onChange={(e) => update(i, { phone: e.target.value })}
            />
          </label>
        </div>
      ))}
      <button type="button" className={styles.addRow} onClick={() => onChange([...rows, { label: "", phone: "" }])}>
        + 연락처 추가
      </button>
    </div>
  );
}
