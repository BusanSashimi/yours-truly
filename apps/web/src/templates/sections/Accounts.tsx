"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { InvitationDesignFields } from "@yours-truly/shared";
import { Container, Eyebrow, SectionTitle } from "../theme";
import styles from "./Accounts.module.scss";

type Accounts = NonNullable<InvitationDesignFields["accounts"]>;
type Account = Accounts[number];
type Side = NonNullable<Account["side"]> | "other";

const GROUP_ORDER: Side[] = ["groom", "bride", "other"];

/**
 * 마음 전하실 곳 (gift accounts) — a client island. Accounts are grouped by side
 * into collapsible panels; each row shows the holder/relation, bank + number,
 * a clipboard-copy button, and an optional KakaoPay link. Themed via CSS
 * variables. Renders nothing without any accounts.
 */
export function Accounts({ accounts }: { accounts?: InvitationDesignFields["accounts"] }) {
  const t = useTranslations("Invitation.Accounts");
  const tc = useTranslations("Common");
  const sideLabel = (side: Side) =>
    side === "groom" ? tc("groomSide") : side === "bride" ? tc("brideSide") : tc("other");

  // Build ordered, non-empty groups once for both the panels and initial state.
  const groups = GROUP_ORDER.map((side) => ({
    side,
    label: sideLabel(side),
    items: (accounts ?? []).filter((a) => (a.side ?? "other") === side),
  })).filter((g) => g.items.length > 0);

  // Open the first group by default; others start collapsed.
  const [open, setOpen] = useState<Side | null>(groups[0]?.side ?? null);
  const [copied, setCopied] = useState<string | null>(null);

  if (groups.length === 0) return null;

  function toggle(side: Side) {
    setOpen((cur) => (cur === side ? null : side));
  }

  async function copyNumber(key: string, number: string) {
    try {
      await navigator.clipboard.writeText(number);
      setCopied(key);
      window.setTimeout(() => {
        setCopied((cur) => (cur === key ? null : cur));
      }, 1500);
    } catch {
      // Clipboard unavailable (e.g. insecure context); silently ignore.
    }
  }

  return (
    <section className={styles.section}>
      <Container>
        <Eyebrow>Gift</Eyebrow>
        <SectionTitle>{t("title")}</SectionTitle>
        <div className={styles.groups}>
          {groups.map((group) => {
            const isOpen = open === group.side;
            return (
              <div key={group.side} className={styles.group}>
                <button
                  type="button"
                  className={styles.panelToggle}
                  onClick={() => toggle(group.side)}
                  aria-expanded={isOpen}
                >
                  <span className={styles.panelLabel}>{group.label}</span>
                  <span className={isOpen ? styles.chevronOpen : styles.chevron} aria-hidden>
                    ⌄
                  </span>
                </button>
                {isOpen && (
                  <ul className={styles.rows}>
                    {group.items.map((account, i) => {
                      const copyKey = `${group.side}-${i}`;
                      const name = [account.relation, account.holder]
                        .filter(Boolean)
                        .join(" · ");
                      const bankLine = [account.bank, account.number]
                        .filter(Boolean)
                        .join(" ");
                      return (
                        <li key={copyKey} className={styles.row}>
                          <div className={styles.info}>
                            {name && <p className={styles.name}>{name}</p>}
                            {bankLine && <p className={styles.bank}>{bankLine}</p>}
                          </div>
                          <div className={styles.actions}>
                            {account.number && (
                              <button
                                type="button"
                                className={styles.copy}
                                onClick={() => copyNumber(copyKey, account.number ?? "")}
                              >
                                {copied === copyKey ? t("copied") : t("copy")}
                              </button>
                            )}
                            {account.kakaoPayUrl && (
                              <a
                                className={styles.kakao}
                                href={account.kakaoPayUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                {t("kakaoPay")}
                              </a>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
