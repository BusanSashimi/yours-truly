import { useTranslations } from "next-intl";
import type { InvitationDesignFields } from "@yours-truly/shared";
import { Container, Eyebrow } from "../theme";
import styles from "./ParentsContacts.module.scss";

type Parents = NonNullable<InvitationDesignFields["parents"]>;
type Parent = NonNullable<Parents["groomFather"]>;
type Contact = NonNullable<InvitationDesignFields["contacts"]>[number];

/**
 * 혼주 (parents) line + 연락처 (contacts) block. The lineage lines name each
 * couple member's parents with 故 markers for the deceased; each contact is a
 * tel: link. Both halves degrade independently and the whole section renders
 * nothing when neither has any usable data. Themed via CSS variables.
 */
export function ParentsContacts({
  parents,
  contacts,
}: {
  parents?: InvitationDesignFields["parents"];
  contacts?: InvitationDesignFields["contacts"];
}) {
  const t = useTranslations("Invitation.ParentsContacts");

  /** A parent's display name with the 故 marker prefixed when deceased. */
  const pName = (parent?: Parent): string | undefined =>
    parent?.name
      ? parent.deceased
        ? t("deceasedName", { name: parent.name })
        : parent.name
      : undefined;

  /** "{father} · {mother}" + a localized role suffix; drops empties gracefully. */
  const renderLineage = (
    father: string | undefined,
    mother: string | undefined,
    role: "roleSon" | "roleDaughter",
  ) => {
    const names = [father, mother].filter(Boolean).join(" · ");
    if (!names) return null;
    return (
      <p className={styles.lineage}>
        <span className={styles.names}>{names}</span>
        <span className={styles.role}>{t(role)}</span>
      </p>
    );
  };

  const groomLine = renderLineage(
    pName(parents?.groomFather),
    pName(parents?.groomMother),
    "roleSon",
  );
  const brideLine = renderLineage(
    pName(parents?.brideFather),
    pName(parents?.brideMother),
    "roleDaughter",
  );

  const callable: Contact[] = (contacts ?? []).filter((c) => c.phone && c.label);

  if (!groomLine && !brideLine && callable.length === 0) return null;

  return (
    <section className={styles.section}>
      <Container>
        {(groomLine || brideLine) && (
          <div className={styles.parents}>
            {groomLine}
            {brideLine}
          </div>
        )}
        {callable.length > 0 && (
          <div className={styles.contacts}>
            <Eyebrow>Contact</Eyebrow>
            <ul className={styles.list}>
              {callable.map((contact, i) => (
                <li key={`${contact.label}-${i}`} className={styles.item}>
                  <span className={styles.meta}>
                    <span className={styles.label}>{contact.label}</span>
                    {contact.name && <span className={styles.name}>{contact.name}</span>}
                  </span>
                  <a className={styles.call} href={`tel:${contact.phone}`} aria-label={t("callAria", { label: contact.label })}>
                    <svg
                      className={styles.icon}
                      viewBox="0 0 24 24"
                      width="16"
                      height="16"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M6.6 10.8a13 13 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.24 11.4 11.4 0 0 0 3.6.58 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1 11.4 11.4 0 0 0 .58 3.6 1 1 0 0 1-.24 1z" />
                    </svg>
                    {t("call")}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Container>
    </section>
  );
}
