"use client";

import type { InvitationDesignFields } from "@yours-truly/shared";
import { ImageField } from "./ImageField";
import type { ImageUploader, PanelProps } from "./types";
import styles from "../../../dashboard.module.scss";

type Tabs = NonNullable<InvitationDesignFields["tabs"]>;
type Tab = NonNullable<Tabs["photobooth"]>;

const TABS: { key: keyof Tabs; label: string }[] = [
  { key: "photobooth", label: "포토부스" },
  { key: "parking", label: "주차안내" },
  { key: "favor", label: "답례품" },
];

/** 포토부스 / 주차안내 / 답례품 — tabbed info, each with text + an optional image. */
export function InfoTabsPanel({ value, onChange, upload }: PanelProps<Tabs> & { upload: ImageUploader }) {
  const tabs: Tabs = value ?? {};
  function update(key: keyof Tabs, patch: Partial<Tab>) {
    const merged: Tab = { ...tabs[key], ...patch };
    const keep = merged.text?.trim() || merged.imageKey;
    const next: Tabs = { ...tabs, [key]: keep ? merged : undefined };
    onChange(TABS.some((t) => next[t.key]) ? next : undefined);
  }
  return (
    <div>
      {TABS.map(({ key, label }) => {
        const tab: Tab = tabs[key] ?? {};
        return (
          <div key={key} className={styles.rowCard}>
            <div className={styles.rowHead}>
              <span>{label}</span>
            </div>
            <label className={styles.field}>
              <span>안내</span>
              <textarea value={tab.text ?? ""} onChange={(e) => update(key, { text: e.target.value })} />
            </label>
            <ImageField value={tab.imageKey} onChange={(k) => update(key, { imageKey: k })} upload={upload} />
          </div>
        );
      })}
    </div>
  );
}
