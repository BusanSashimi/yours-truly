import Image from "next/image";
import type { InvitationDesignFields } from "@yours-truly/shared";
import { assetUrl } from "@/lib/assets";
import { Container, Eyebrow } from "../theme";
import styles from "./ProfileCards.module.scss";

type Profiles = InvitationDesignFields["profiles"];
type Person = NonNullable<NonNullable<Profiles>["groom"]>;

/** A labelled meta line under the name (e.g. "MBTI · ESFJ"), only when present. */
function MetaLine({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <p className={styles.meta}>
      <span className={styles.metaLabel}>{label}</span>
      <span className={styles.metaValue}>{value}</span>
    </p>
  );
}

/** One side's card: portrait (optional) + name + any meta lines + traits. */
function Card({ side, person, name }: { side: string; person?: Person; name?: string }) {
  // Nothing to show for this side at all — drop the whole card.
  if (!person && !name) return null;

  const traits = person?.traits?.filter((t) => t.trim().length > 0) ?? [];

  return (
    <article className={styles.card}>
      {person?.photoKey && (
        <div className={styles.photo}>
          <Image
            src={assetUrl(person.photoKey)}
            alt=""
            fill
            sizes="(max-width: 480px) 50vw, 200px"
            className={styles.img}
          />
        </div>
      )}
      <p className={styles.side}>{side}</p>
      {name && <h3 className={styles.name}>{name}</h3>}
      {person && (
        <div className={styles.metaList}>
          <MetaLine label="생년" value={person.birth} />
          <MetaLine label="지역" value={person.region} />
          <MetaLine label="MBTI" value={person.mbti} />
          <MetaLine label="한마디" value={person.role} />
        </div>
      )}
      {traits.length > 0 && (
        <ul className={styles.traits}>
          {traits.map((trait) => (
            <li key={trait} className={styles.trait}>
              {trait}
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}

/**
 * Couple profile cards (신랑/신부 소개) — two cards side by side, each showing the
 * person's portrait, name, and a few small meta lines (생년/지역/MBTI/한마디) plus
 * trait chips. Themed entirely via CSS variables. Renders nothing when neither
 * side has any profile data; a card whose side is empty is dropped on its own.
 */
export function ProfileCards({
  profiles,
  groomName,
  brideName,
}: {
  profiles?: Profiles;
  groomName?: string;
  brideName?: string;
}) {
  const groom = profiles?.groom;
  const bride = profiles?.bride;

  // Per spec: render nothing when profiles has neither groom nor bride.
  if (!groom && !bride) return null;

  return (
    <section className={styles.section}>
      <Container>
        <Eyebrow>Profile</Eyebrow>
        <div className={styles.cards}>
          <Card side="신랑" person={groom} name={groomName} />
          <Card side="신부" person={bride} name={brideName} />
        </div>
      </Container>
    </section>
  );
}
