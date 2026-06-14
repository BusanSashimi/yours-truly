"use client";

import { useEffect, useRef, useState } from "react";
import { QRCodeCanvas, QRCodeSVG } from "qrcode.react";
import styles from "../../../dashboard.module.scss";

/**
 * QR card for the couple's private-message submit page. The encoded URL is
 * `${origin}/invitations/<slug>/send` — origin is read after mount (the canonical
 * host in prod, localhost in dev), so no new env is needed. A hidden 1024px
 * canvas backs the PNG download; the visible SVG is serialized for the SVG
 * download. Both carry the spec's 4-module quiet zone so prints scan reliably.
 */
export function QrCard({ slug }: { slug: string }) {
  const [url, setUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    setUrl(`${window.location.origin}/invitations/${slug}/send`);
  }, [slug]);

  if (!url) return null;

  async function copy() {
    try {
      await navigator.clipboard.writeText(url!);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked (e.g. insecure context); the URL is shown to copy manually */
    }
  }

  function downloadPng() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = `${slug}-qr.png`;
    a.click();
  }

  function downloadSvg() {
    const svg = svgRef.current;
    if (!svg) return;
    const xml = new XMLSerializer().serializeToString(svg);
    const href = URL.createObjectURL(new Blob([xml], { type: "image/svg+xml" }));
    const a = document.createElement("a");
    a.href = href;
    a.download = `${slug}-qr.svg`;
    a.click();
    URL.revokeObjectURL(href);
  }

  return (
    <div className={styles.qrCard}>
      <QRCodeSVG
        ref={svgRef}
        value={url}
        size={180}
        marginSize={4}
        title="QR 메시지 페이지"
        className={styles.qrImg}
      />
      {/* Hidden high-res canvas, source for the PNG download. */}
      <QRCodeCanvas
        ref={canvasRef}
        value={url}
        size={1024}
        marginSize={4}
        style={{ display: "none" }}
      />
      <p className={styles.qrUrl}>{url}</p>
      <div className={styles.qrActions}>
        <button type="button" className={styles.subtle} onClick={() => void copy()}>
          {copied ? "복사됨" : "주소 복사"}
        </button>
        <button type="button" className={styles.subtle} onClick={downloadPng}>
          PNG 다운로드
        </button>
        <button type="button" className={styles.subtle} onClick={downloadSvg}>
          SVG 다운로드
        </button>
      </div>
    </div>
  );
}
