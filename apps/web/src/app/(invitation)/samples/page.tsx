import type { Metadata } from "next";
import Link from "next/link";
import { TEMPLATE_METAS } from "@/templates/meta";
import styles from "./samples.module.scss";

export const metadata: Metadata = {
  title: "디자인 샘플 · Yours Truly",
  description: "Yours Truly의 청첩장 디자인을 미리 둘러보세요.",
};

/** Public design gallery — browse every template with sample content. */
export default function SamplesGalleryPage() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link href="/" className={styles.brand}>
          Yours Truly
        </Link>
        <h1 className={styles.title}>디자인 샘플</h1>
        <p className={styles.sub}>마음에 드는 디자인을 골라 미리 둘러보세요.</p>
      </header>

      <ul className={styles.grid}>
        {TEMPLATE_METAS.map((meta) => (
          <li key={meta.id}>
            <Link href={`/samples/${meta.id}`} className={styles.card}>
              <span className={styles.thumb}>
                {/* eslint-disable-next-line @next/next/no-img-element -- static
                    /public preview crop; next/image optimization isn't needed
                    for these small gallery thumbnails. */}
                <img src={meta.thumbnail} alt={`${meta.name} 디자인 미리보기`} loading="lazy" />
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
