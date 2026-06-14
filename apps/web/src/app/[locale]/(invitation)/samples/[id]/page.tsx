import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { type Locale } from "@/i18n/routing";
import { notFound } from "next/navigation";
import {
  INVITATION_TEMPLATE_IDS,
  type InvitationTemplateId,
} from "@yours-truly/shared";
import { templateComponent } from "@/templates";
import { TEMPLATE_METAS } from "@/templates/meta";
import { sampleFields, sampleInvitation } from "../sample-data";
import styles from "./sample.module.scss";

type Props = { params: Promise<{ locale: string; id: string }> };

function isTemplateId(id: string): id is InvitationTemplateId {
  return (INVITATION_TEMPLATE_IDS as readonly string[]).includes(id);
}

// All 12 designs are known at build time → fully static, no DB, no runtime data.
export function generateStaticParams(): { id: string }[] {
  return INVITATION_TEMPLATE_IDS.map((id) => ({ id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, id } = await params;
  const t = await getTranslations({ locale: locale as Locale, namespace: "Metadata" });
  const meta = TEMPLATE_METAS.find((m) => m.id === id);
  if (!meta) return { title: t("sampleNotFound") };
  return {
    title: t("sampleTitle", { name: meta.name }),
    description: meta.description,
    // A sample is not a real invitation — keep it out of search results.
    robots: { index: false, follow: false },
  };
}

/** Live preview of one design, rendered from static sample content. */
export default async function SamplePage({ params }: Props) {
  const { locale, id } = await params;
  setRequestLocale(locale as Locale);
  if (!isTemplateId(id)) notFound();
  const t = await getTranslations({ locale: locale as Locale, namespace: "Samples" });

  const Template = templateComponent(id);
  const fields = sampleFields(id);
  return (
    <>
      <Link href="/samples" className={styles.back}>
        {t("back")}
      </Link>
      <Template
        invitation={sampleInvitation(id)}
        fields={fields}
        heroKey={fields.heroImageKey}
      />
    </>
  );
}
