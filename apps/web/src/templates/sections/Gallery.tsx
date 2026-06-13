import Image from "next/image";
import { assetUrl } from "@/lib/assets";
import { Container, Eyebrow, SectionTitle } from "../theme";
import type { GalleryLayout } from "../theme";
import styles from "./Gallery.module.scss";

/**
 * Photo gallery (갤러리). `layout` switches between a 3-column grid and a
 * horizontal scroll-snap carousel (both CSS-only, so this stays a server
 * component). Image keys are the couple's own `i/` assets. Renders nothing
 * when there are no photos.
 */
export function Gallery({
  imageKeys,
  layout = "grid",
  title = "Gallery",
}: {
  imageKeys?: string[];
  layout?: GalleryLayout;
  title?: string;
}) {
  if (!imageKeys || imageKeys.length === 0) return null;
  return (
    <section className={styles.section}>
      <Container>
        <Eyebrow>Gallery</Eyebrow>
        <SectionTitle>{title}</SectionTitle>
      </Container>
      <div className={layout === "carousel" ? styles.carousel : styles.grid}>
        {imageKeys.map((key) => (
          <div key={key} className={styles.cell}>
            <Image
              src={assetUrl(key)}
              alt=""
              fill
              sizes="(max-width: 480px) 33vw, 160px"
              className={styles.img}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
