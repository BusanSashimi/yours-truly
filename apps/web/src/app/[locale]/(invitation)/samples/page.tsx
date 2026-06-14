import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { type Locale } from "@/i18n/routing";
import { TEMPLATE_METAS } from "@/templates/meta";
import styles from "./samples.module.scss";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale: locale as Locale, namespace: "Metadata" });
  return { title: t("samplesTitle"), description: t("samplesDescription") };
}

/** Public design gallery — browse every template with sample content. */
export default async function SamplesGalleryPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  const t = await getTranslations({ locale: locale as Locale, namespace: "Samples" });
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link href="/" className={styles.brand}>
          Yours Truly
        </Link>
        <h1 className={styles.title}>{t("title")}</h1>
        <p className={styles.sub}>{t("subtitle")}</p>
      </header>

      <ul className={styles.grid}>
        {TEMPLATE_METAS.map((meta) => (
          <li key={meta.id}>
            <Link href={`/samples/${meta.id}`} className={styles.card}>
              <span className={styles.thumb}>
                {/* eslint-disable-next-line @next/next/no-img-element -- static
                    /public preview crop; next/image optimization isn't needed
                    for these small gallery thumbnails. */}
                <img src={meta.thumbnail} alt={t("thumbAlt", { name: meta.name })} loading="lazy" />
              </span>
              <span className={styles.name}>{meta.name}</span>
              <span className={styles.desc}>{meta.description}</span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
