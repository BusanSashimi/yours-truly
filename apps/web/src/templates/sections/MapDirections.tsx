import type { InvitationDesignFields } from "@yours-truly/shared";
import { useTranslations } from "next-intl";
import { navAppLinks } from "../format";
import { Container, Eyebrow, SectionTitle } from "../theme";
import styles from "./MapDirections.module.scss";

/** Nav-app buttons in display order; only the ones whose link resolves render. */
const NAV_APPS: { key: "naver" | "kakao" | "tmap" }[] = [
  { key: "naver" },
  { key: "kakao" },
  { key: "tmap" },
];

/** Transit modes in display order; only the ones present in `transit` render. */
const TRANSIT_MODES: {
  key: keyof NonNullable<InvitationDesignFields["transit"]>;
  icon: string;
}[] =
  [
    { key: "bus", icon: "🚌" },
    { key: "subway", icon: "🚇" },
    { key: "car", icon: "🚗" },
    { key: "parking", icon: "🅿️" },
    { key: "shuttle", icon: "🚐" },
  ];

/**
 * Directions to the venue (오시는 길) — venue name + address, nav-app deep links
 * (네이버지도/카카오맵/티맵 built from `navAppLinks`), and free-text transit lines
 * (버스/지하철/자차/주차/셔틀). Server component; renders nothing when there is no
 * venue/map/transit data at all, and degrades gracefully with partial data.
 */
export function MapDirections({
  venueName,
  venueAddress,
  map,
  transit,
}: {
  venueName?: string;
  venueAddress?: string;
  map?: InvitationDesignFields["map"];
  transit?: InvitationDesignFields["transit"];
}) {
  const t = useTranslations("Invitation.MapDirections");
  if (!venueName && !venueAddress && !map && !transit) return null;

  const links = navAppLinks(map, venueName, venueAddress);
  const navApps = NAV_APPS.map((app) => ({ ...app, url: links[app.key] })).filter(
    (app): app is typeof app & { url: string } => Boolean(app.url),
  );
  const transitLines = TRANSIT_MODES.map((mode) => ({
    ...mode,
    text: transit?.[mode.key],
  })).filter((mode): mode is typeof mode & { text: string } => Boolean(mode.text));

  return (
    <section className={styles.section}>
      <Container>
        <Eyebrow>Location</Eyebrow>
        <SectionTitle>{t("title")}</SectionTitle>

        {(venueName || venueAddress) && (
          <div className={styles.venue}>
            {venueName && <p className={styles.venueName}>{venueName}</p>}
            {venueAddress && <p className={styles.venueAddress}>{venueAddress}</p>}
          </div>
        )}

        {navApps.length > 0 && (
          <div className={styles.navApps}>
            {navApps.map((app) => (
              <a
                key={app.key}
                className={styles.navButton}
                href={app.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                {t(app.key)}
              </a>
            ))}
          </div>
        )}

        {transitLines.length > 0 && (
          <ul className={styles.transit}>
            {transitLines.map((mode) => (
              <li key={mode.key} className={styles.transitItem}>
                <span className={styles.transitIcon} aria-hidden="true">
                  {mode.icon}
                </span>
                <div className={styles.transitBody}>
                  <span className={styles.transitLabel}>{t(mode.key)}</span>
                  <span className={styles.transitText}>{mode.text}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Container>
    </section>
  );
}
