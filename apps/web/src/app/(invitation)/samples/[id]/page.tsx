import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  INVITATION_TEMPLATE_IDS,
  type InvitationTemplateId,
} from "@yours-truly/shared";
import { templateComponent } from "@/templates";
import { TEMPLATE_METAS } from "@/templates/meta";
import { sampleFields, sampleInvitation } from "../sample-data";
import styles from "./sample.module.scss";

type Props = { params: Promise<{ id: string }> };

function isTemplateId(id: string): id is InvitationTemplateId {
  return (INVITATION_TEMPLATE_IDS as readonly string[]).includes(id);
}

// All 12 designs are known at build time → fully static, no DB, no runtime data.
export function generateStaticParams(): { id: string }[] {
  return INVITATION_TEMPLATE_IDS.map((id) => ({ id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const meta = TEMPLATE_METAS.find((m) => m.id === id);
  if (!meta) return { title: "샘플을 찾을 수 없습니다" };
  return {
    title: `${meta.name} · 디자인 샘플`,
    description: meta.description,
    // A sample is not a real invitation — keep it out of search results.
    robots: { index: false, follow: false },
  };
}

/** Live preview of one design, rendered from static sample content. */
export default async function SamplePage({ params }: Props) {
  const { id } = await params;
  if (!isTemplateId(id)) notFound();

  const Template = templateComponent(id);
  const fields = sampleFields(id);
  return (
    <>
      <Link href="/samples" className={styles.back}>
        ← 디자인 목록
      </Link>
      <Template
        invitation={sampleInvitation(id)}
        fields={fields}
        heroKey={fields.heroImageKey}
      />
    </>
  );
}
