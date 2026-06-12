import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  invitationDesignFieldsSchema,
  invitationResponseSchema,
  type Invitation,
  type InvitationDesignFields,
} from "@yours-truly/shared";
import { assetUrl, isRenderableAssetKey } from "@/lib/assets";
import styles from "./page.module.scss";

/**
 * Guests reread a published invitation far more often than couples edit one,
 * so the route is ISR-cached and refreshed at most once a minute. Edits,
 * unpublishing, and deletion all take effect within the same window.
 */
export const revalidate = 60;

// Web and API share a host (nginx routes /api/* to :4000 publicly); the SSR
// server talks to the API directly over loopback instead of going back out
// through nginx.
const API_ORIGIN = process.env.API_ORIGIN ?? "http://127.0.0.1:4000";

type Props = { params: Promise<{ slug: string }> };

/** Fetch a published invitation, or null if it doesn't exist (or is a draft). */
async function fetchPublished(slug: string): Promise<Invitation | null> {
  const res = await fetch(
    `${API_ORIGIN}/api/invitations/by-slug/${encodeURIComponent(slug)}`,
    { next: { revalidate: 60 } },
  );
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`invitation API responded ${res.status} for slug "${slug}"`);
  return invitationResponseSchema.parse(await res.json()).invitation;
}

/** Lenient read of the renderer-known fields; an unreadable doc renders minimal. */
function designFields(design: Invitation["design"]): InvitationDesignFields {
  const parsed = invitationDesignFieldsSchema.safeParse(design);
  return parsed.success ? parsed.data : {};
}

// Pinned to Asia/Seoul so the rendered time never depends on the server's
// timezone (design docs store UTC instants; the product is Korean-market).
function formatCeremonyDate(iso: string): string {
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "Asia/Seoul",
  }).format(new Date(iso));
}

// Opts the dynamic segment into the full route cache: slugs not known at
// build time render once on demand, then serve as ISR (see `revalidate`).
export async function generateStaticParams(): Promise<{ slug: string }[]> {
  return [];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const invitation = await fetchPublished(slug); // deduped with the page render
  if (!invitation) return { title: "청첩장을 찾을 수 없습니다" };

  const fields = designFields(invitation.design);
  const title =
    fields.groomName && fields.brideName
      ? `${fields.groomName} ♥ ${fields.brideName} 결혼합니다`
      : "저희 결혼식에 초대합니다";
  const description =
    fields.message?.replace(/\s+/g, " ").trim().slice(0, 80) ||
    [fields.venueName, fields.dateTime && formatCeremonyDate(fields.dateTime)]
      .filter(Boolean)
      .join(" · ") ||
    "모바일 청첩장";

  // The hero (client-side re-encoded at upload: ≤2048px JPEG, well under
  // KakaoTalk's 5MB scraper limit) doubles as the link-preview image.
  const ogImage = isRenderableAssetKey(fields.heroImageKey, invitation.id)
    ? [{ url: assetUrl(fields.heroImageKey) }]
    : undefined;

  return {
    title,
    description,
    // Privacy default: a wedding invitation names people and says when their
    // home is empty. Keep guest pages out of search engines; indexing can
    // become a per-invitation opt-in later.
    robots: { index: false, follow: false },
    openGraph: { title, description, type: "website", images: ogImage },
  };
}

export default async function InvitationPage({ params }: Props) {
  const { slug } = await params;
  const invitation = await fetchPublished(slug);
  if (!invitation) notFound();

  const fields = designFields(invitation.design);
  const heroKey = isRenderableAssetKey(fields.heroImageKey, invitation.id)
    ? fields.heroImageKey
    : undefined;

  return (
    <main className={styles.page}>
      <article className={styles.card}>
        {heroKey && (
          <div className={styles.hero}>
            <Image
              src={assetUrl(heroKey)}
              alt=""
              fill
              priority
              sizes="(max-width: 480px) 100vw, 420px"
              className={styles.heroImg}
            />
          </div>
        )}
        <p className={styles.eyebrow}>Wedding Invitation</p>

        {fields.groomName && fields.brideName ? (
          <h1 className={styles.names}>
            {fields.groomName}
            <span className={styles.amp} aria-hidden>
              ·
            </span>
            {fields.brideName}
          </h1>
        ) : (
          <h1 className={styles.names}>저희 결혼합니다</h1>
        )}

        {fields.message && <p className={styles.message}>{fields.message}</p>}

        {(fields.dateTime || fields.venueName) && (
          <dl className={styles.details}>
            {fields.dateTime && (
              <div className={styles.detailRow}>
                <dt>일시</dt>
                <dd>{formatCeremonyDate(fields.dateTime)}</dd>
              </div>
            )}
            {fields.venueName && (
              <div className={styles.detailRow}>
                <dt>장소</dt>
                <dd>
                  {fields.venueName}
                  {fields.venueAddress && (
                    <span className={styles.address}>{fields.venueAddress}</span>
                  )}
                </dd>
              </div>
            )}
          </dl>
        )}
      </article>
    </main>
  );
}
