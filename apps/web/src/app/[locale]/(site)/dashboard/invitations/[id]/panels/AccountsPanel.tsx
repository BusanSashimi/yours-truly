"use client";

import type { InvitationDesignFields } from "@yours-truly/shared";
import type { PanelProps } from "./types";
import styles from "../../../dashboard.module.scss";

type Accounts = NonNullable<InvitationDesignFields["accounts"]>;

/** 마음 전하실 곳 — gift/account rows. kakaoPayUrl is pruned to undefined when blank (URL-validated). */
export function AccountsPanel({ value, onChange }: PanelProps<Accounts>) {
  const rows: Accounts = value ?? [];
  function update(i: number, patch: Partial<Accounts[number]>) {
    onChange(
      rows.map((r, idx) => {
        if (idx !== i) return r;
        const merged = { ...r, ...patch };
        return { ...merged, kakaoPayUrl: merged.kakaoPayUrl?.trim() || undefined };
      }),
    );
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
            <span>계좌 {i + 1}</span>
            <button type="button" className={styles.removeRow} onClick={() => remove(i)}>
              삭제
            </button>
          </div>
          <div className={styles.fieldRow}>
            <label className={styles.field}>
              <span>구분</span>
              <select
                value={row.side ?? ""}
                onChange={(e) =>
                  update(i, { side: e.target.value ? (e.target.value as "groom" | "bride") : undefined })
                }
              >
                <option value="">미지정</option>
                <option value="groom">신랑측</option>
                <option value="bride">신부측</option>
              </select>
            </label>
            <label className={styles.field}>
              <span>관계</span>
              <input
                value={row.relation ?? ""}
                placeholder="신랑 / 신랑 아버지"
                onChange={(e) => update(i, { relation: e.target.value })}
              />
            </label>
          </div>
          <div className={styles.fieldRow}>
            <label className={styles.field}>
              <span>은행</span>
              <input value={row.bank ?? ""} onChange={(e) => update(i, { bank: e.target.value })} />
            </label>
            <label className={styles.field}>
              <span>예금주</span>
              <input value={row.holder ?? ""} onChange={(e) => update(i, { holder: e.target.value })} />
            </label>
          </div>
          <label className={styles.field}>
            <span>계좌번호</span>
            <input value={row.number ?? ""} onChange={(e) => update(i, { number: e.target.value })} />
          </label>
          <label className={styles.field}>
            <span>카카오페이 링크</span>
            <input value={row.kakaoPayUrl ?? ""} onChange={(e) => update(i, { kakaoPayUrl: e.target.value })} />
          </label>
        </div>
      ))}
      <button type="button" className={styles.addRow} onClick={() => onChange([...rows, {}])}>
        + 계좌 추가
      </button>
    </div>
  );
}
