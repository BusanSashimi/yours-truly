import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { routing, type Locale } from "@/i18n/routing";
import "../../reset.scss";

/**
 * Root layout for guest-facing invitation pages (/invitations/<slug>).
 * Deliberately bare: no site skin, fonts, or chrome — each invitation
 * template owns its entire look, and the couple's page must be immune to
 * marketing-site restyles. Per-invitation metadata (title, OG tags) comes
 * from generateMetadata in the [slug] page.
 */
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function InvitationLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as Locale)) notFound();
  setRequestLocale(locale as Locale);

  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
