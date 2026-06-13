"use client";

import type { InvitationTemplateId } from "@yours-truly/shared";
import { TEMPLATE_METAS } from "@/templates/meta";
import styles from "./dashboard.module.scss";

/** Radio-card grid for choosing a design template (create form and editor). */
export function TemplatePicker({
  value,
  onChange,
}: {
  value: InvitationTemplateId;
  onChange: (id: InvitationTemplateId) => void;
}) {
  return (
    <div className={styles.templateGrid} role="radiogroup" aria-label="디자인 템플릿">
      {TEMPLATE_METAS.map((meta) => (
        <label key={meta.id} className={styles.templateOption} title={meta.description}>
          <input
            type="radio"
            name="design-template"
            value={meta.id}
            checked={value === meta.id}
            onChange={() => onChange(meta.id)}
          />
          <span className={styles.templateThumb}>
            {/* eslint-disable-next-line @next/next/no-img-element -- small
                dashboard preview of a static mock; the guest page is where
                next/image matters */}
            <img src={meta.thumbnail} alt="" loading="lazy" />
          </span>
          <span className={styles.templateName}>{meta.name}</span>
        </label>
      ))}
    </div>
  );
}
