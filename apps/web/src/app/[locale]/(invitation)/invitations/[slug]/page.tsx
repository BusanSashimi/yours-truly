import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { type Locale } from "@/i18n/routing";
import {
  invitationDesignFieldsSchema,
  invitationResponseSchema,
  type Invitation,
  type InvitationDesignFields,
} from "@yours-truly/shared";
import { assetUrl, isRenderableAssetKey } from "@/lib/assets";
import { templateComponent } from "@/templates";

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

type Props = { params: Promise<{ locale: string; slug: string }> };

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
function formatCeremonyDate(iso: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
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
  const { locale, slug } = await params;
  const t = await getTranslations({ locale: locale as Locale, namespace: "Metadata" });
  const invitation = await fetchPublished(slug); // deduped with the page render
  if (!invitation) return { title: t("invitationNotFound") };

  const fields = designFields(invitation.design);
  const title =
    fields.groomName && fields.brideName
      ? t("invitationTitle", { groom: fields.groomName, bride: fields.brideName })
      : t("invitationTitleFallback");
  const description =
    fields.message?.replace(/\s+/g, " ").trim().slice(0, 80) ||
    [fields.venueName, fields.dateTime && formatCeremonyDate(fields.dateTime, locale)]
      .filter(Boolean)
      .join(" · ") ||
    t("invitationDescFallback");

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
  const { locale, slug } = await params;
  setRequestLocale(locale as Locale);
  const invitation = await fetchPublished(slug);
  if (!invitation) notFound();

  const fields = designFields(invitation.design);
  const heroKey = isRenderableAssetKey(fields.heroImageKey, invitation.id)
    ? fields.heroImageKey
    : undefined;

  // Each template owns the entire page; unknown/missing template ids fall
  // back to the default so pre-template documents keep rendering.
  const Template = templateComponent(fields.template);
  return <Template invitation={invitation} fields={fields} heroKey={heroKey} />;
}
