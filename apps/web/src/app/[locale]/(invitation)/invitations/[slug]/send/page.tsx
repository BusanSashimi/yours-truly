import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { type Locale } from "@/i18n/routing";
import {
  invitationDesignFieldsSchema,
  invitationResponseSchema,
  type Invitation,
} from "@yours-truly/shared";
import { SendForm } from "./SendForm";
import styles from "./send.module.scss";

/**
 * QR message submit page (비공개 축하 메시지·사진). The couple's QR code points here;
 * guests leave a private message + photos that land only in the dashboard inbox.
 * Standalone within the bare (invitation) layout — no template chrome — so it
 * carries its own styling. ISR-cached like the invitation page; the openDate
 * gate is evaluated client-side in SendForm and re-enforced by the API.
 */
export const revalidate = 60;

// SSR talks to the API directly over loopback (nginx routes /api/* publicly).
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

function guestMessageSettings(design: Invitation["design"]) {
  const parsed = invitationDesignFieldsSchema.safeParse(design);
  return parsed.success ? parsed.data.guestMessages : undefined;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale: locale as Locale, namespace: "Metadata" });
  // A QR submit page should never be indexed — it names the couple and is a
  // write surface, not content.
  return { title: t("sendTitle"), robots: { index: false, follow: false } };
}

export default async function SendPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale as Locale);
  const t = await getTranslations({ locale: locale as Locale, namespace: "Send" });
  const invitation = await fetchPublished(slug);
  if (!invitation) notFound();

  const settings = guestMessageSettings(invitation.design);

  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <p className={styles.eyebrow}>Message</p>
        <h1 className={styles.title}>
          {settings?.prompt || t("promptFallback")}
        </h1>
        {settings?.enabled ? (
          <SendForm invitationId={invitation.id} openDate={settings.openDate} />
        ) : (
          <p className={styles.notice}>{t("closed")}</p>
        )}
      </div>
    </main>
  );
}
