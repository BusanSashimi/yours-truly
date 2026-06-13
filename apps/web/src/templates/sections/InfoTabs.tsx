"use client";

import { useState } from "react";
import Image from "next/image";
import type { InvitationDesignFields } from "@yours-truly/shared";
import { assetUrl } from "@/lib/assets";
import { Container, Eyebrow, SectionTitle } from "../theme";
import styles from "./InfoTabs.module.scss";

type Tabs = NonNullable<InvitationDesignFields["tabs"]>;
type TabKey = keyof Tabs;
type Panel = NonNullable<Tabs[TabKey]>;

/** Guest-facing labels for each known tab key (포토부스 / 주차안내 / 답례품). */
const TAB_LABELS: Record<TabKey, string> = {
  photobooth: "포토부스",
  parking: "주차안내",
  favor: "답례품",
};

/** Fixed display order regardless of object key order. */
const TAB_ORDER: TabKey[] = ["photobooth", "parking", "favor"];

function hasContent(panel: Panel | undefined): panel is Panel {
  return Boolean(panel && (panel.text || panel.imageKey));
}

/**
 * Tabbed extras (포토부스 / 주차안내 / 답례품) — a client island whose tab bar
 * switches the active panel. Only tabs that carry text or an image are shown;
 * each panel renders an optional photo above pre-line text. Renders nothing
 * when no tab has any content. Themed entirely via CSS variables.
 */
export function InfoTabs({ tabs }: { tabs?: InvitationDesignFields["tabs"] }) {
  const present = TAB_ORDER.filter((key) => hasContent(tabs?.[key]));
  const [active, setActive] = useState<TabKey>(present[0] ?? "photobooth");

  if (present.length === 0) return null;

  // Guard against an active key that was filtered out (defensive; present is stable).
  const activeKey = present.includes(active) ? active : present[0];
  const panel = tabs![activeKey]!;

  return (
    <section className={styles.section}>
      <Container>
        <Eyebrow>Information</Eyebrow>
        <SectionTitle>안내</SectionTitle>

        {present.length > 1 && (
          <div className={styles.tabBar} role="tablist">
            {present.map((key) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={key === activeKey}
                className={key === activeKey ? styles.tabOn : styles.tabOff}
                onClick={() => setActive(key)}
              >
                {TAB_LABELS[key]}
              </button>
            ))}
          </div>
        )}

        <div className={styles.panel} role="tabpanel">
          {panel.imageKey && (
            <div className={styles.figure}>
              <Image
                src={assetUrl(panel.imageKey)}
                alt={TAB_LABELS[activeKey]}
                fill
                sizes="(max-width: 480px) 100vw, 424px"
                className={styles.img}
              />
            </div>
          )}
          {panel.text && <p className={styles.text}>{panel.text}</p>}
        </div>
      </Container>
    </section>
  );
}
