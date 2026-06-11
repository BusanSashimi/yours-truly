import "../reset.scss";

/**
 * Root layout for guest-facing invitation pages (/invitations/<slug>).
 * Deliberately bare: no site skin, fonts, or chrome — each invitation
 * template owns its entire look, and the couple's page must be immune to
 * marketing-site restyles. Per-invitation metadata (title, OG tags) comes
 * from generateMetadata in the [slug] page.
 */
export default function InvitationLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
