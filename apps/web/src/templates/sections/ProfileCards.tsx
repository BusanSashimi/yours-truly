import Image from "next/image";
import type { InvitationDesignFields } from "@yours-truly/shared";
import { assetUrl } from "@/lib/assets";
import { useTranslations } from "next-intl";
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
  const tp = useTranslations("Invitation.ProfileCards");
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
          <MetaLine label={tp("birth")} value={person.birth} />
          <MetaLine label={tp("region")} value={person.region} />
          <MetaLine label={tp("mbti")} value={person.mbti} />
          <MetaLine label={tp("role")} value={person.role} />
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
  const tc = useTranslations("Common");
  const groom = profiles?.groom;
  const bride = profiles?.bride;

  // Per spec: render nothing when profiles has neither groom nor bride.
  if (!groom && !bride) return null;

  return (
    <section className={styles.section}>
      <Container>
        <Eyebrow>Profile</Eyebrow>
        <div className={styles.cards}>
          <Card side={tc("groom")} person={groom} name={groomName} />
          <Card side={tc("bride")} person={bride} name={brideName} />
        </div>
      </Container>
    </section>
  );
}
