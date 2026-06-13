import Image from "next/image";
import { assetUrl } from "@/lib/assets";
import styles from "./ClosingPhotos.module.scss";

/**
 * Closing photo(s) (마무리) — a full-bleed, edge-to-edge stack of dark cover
 * photos with a centered farewell message overlaid in white. With no images
 * the message sits on a deep charcoal panel instead. Renders nothing when
 * neither the images nor the message are present.
 */
export function ClosingPhotos({
  imageKeys,
  message,
}: {
  imageKeys?: string[];
  message?: string;
}) {
  const hasImages = Boolean(imageKeys && imageKeys.length > 0);
  if (!hasImages && !message) return null;

  return (
    <section className={hasImages ? styles.section : `${styles.section} ${styles.panel}`}>
      {hasImages &&
        imageKeys!.map((key) => (
          <div key={key} className={styles.frame}>
            <Image
              src={assetUrl(key)}
              alt=""
              fill
              sizes="100vw"
              className={styles.img}
            />
            <span className={styles.scrim} aria-hidden />
          </div>
        ))}
      {message && (
        <div className={styles.overlay}>
          <p className={styles.message}>{message}</p>
        </div>
      )}
    </section>
  );
}
