import type { InvitationDesignFields } from "@yours-truly/shared";
import { navAppLinks } from "../format";
import { Container, Eyebrow, SectionTitle } from "../theme";
import styles from "./MapDirections.module.scss";

/** Nav-app buttons in display order; only the ones whose link resolves render. */
const NAV_APPS: { key: "naver" | "kakao" | "tmap"; label: string }[] = [
  { key: "naver", label: "네이버지도" },
  { key: "kakao", label: "카카오맵" },
  { key: "tmap", label: "티맵" },
];

/** Transit modes in display order; only the ones present in `transit` render. */
const TRANSIT_MODES: {
  key: keyof NonNullable<InvitationDesignFields["transit"]>;
  label: string;
  icon: string;
}[] =
  [
    { key: "bus", label: "버스", icon: "🚌" },
    { key: "subway", label: "지하철", icon: "🚇" },
    { key: "car", label: "자차", icon: "🚗" },
    { key: "parking", label: "주차", icon: "🅿️" },
    { key: "shuttle", label: "셔틀", icon: "🚐" },
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
        <SectionTitle>오시는 길</SectionTitle>

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
                {app.label}
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
                  <span className={styles.transitLabel}>{mode.label}</span>
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
