"use client";

import type { InvitationDesignFields } from "@yours-truly/shared";
import { ImageField } from "./ImageField";
import type { ImageUploader, PanelProps } from "./types";
import styles from "../../../dashboard.module.scss";

type Profiles = NonNullable<InvitationDesignFields["profiles"]>;
type Person = NonNullable<Profiles["groom"]>;

const SIDES: { key: keyof Profiles; label: string }[] = [
  { key: "groom", label: "신랑" },
  { key: "bride", label: "신부" },
];

/** 신랑/신부 소개 — portrait, birth/region/MBTI/한마디, and comma-separated keywords. */
export function ProfilesPanel({ value, onChange, upload }: PanelProps<Profiles> & { upload: ImageUploader }) {
  const profiles: Profiles = value ?? {};

  function update(side: keyof Profiles, patch: Partial<Person>) {
    const merged: Person = { ...profiles[side], ...patch };
    const keep =
      merged.photoKey ||
      merged.birth?.trim() ||
      merged.region?.trim() ||
      merged.mbti?.trim() ||
      merged.role?.trim() ||
      (merged.traits && merged.traits.length > 0) ||
      merged.bio?.trim();
    const next: Profiles = { ...profiles, [side]: keep ? merged : undefined };
    onChange(next.groom || next.bride ? next : undefined);
  }

  return (
    <div>
      {SIDES.map(({ key, label }) => {
        const p: Person = profiles[key] ?? {};
        return (
          <div key={key} className={styles.rowCard}>
            <div className={styles.rowHead}>
              <span>{label}</span>
            </div>
            <ImageField value={p.photoKey} onChange={(k) => update(key, { photoKey: k })} upload={upload} />
            <div className={styles.fieldRow}>
              <label className={styles.field}>
                <span>생년</span>
                <input value={p.birth ?? ""} onChange={(e) => update(key, { birth: e.target.value })} />
              </label>
              <label className={styles.field}>
                <span>지역</span>
                <input value={p.region ?? ""} onChange={(e) => update(key, { region: e.target.value })} />
              </label>
            </div>
            <div className={styles.fieldRow}>
              <label className={styles.field}>
                <span>MBTI</span>
                <input value={p.mbti ?? ""} onChange={(e) => update(key, { mbti: e.target.value })} />
              </label>
              <label className={styles.field}>
                <span>소개 한마디</span>
                <input value={p.role ?? ""} onChange={(e) => update(key, { role: e.target.value })} />
              </label>
            </div>
            <label className={styles.field}>
              <span>키워드 (쉼표로 구분)</span>
              <input
                value={(p.traits ?? []).join(", ")}
                placeholder="다정함, 요리"
                onChange={(e) => {
                  const traits = e.target.value.split(",").map((s) => s.trim()).filter(Boolean);
                  update(key, { traits: traits.length ? traits : undefined });
                }}
              />
            </label>
          </div>
        );
      })}
    </div>
  );
}
