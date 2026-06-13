import type { Invitation, InvitationDesignFields } from "@yours-truly/shared";

/**
 * Contract between the public renderer and every design template. A template
 * owns the entire page (its own <main>, colors, fonts) and must render
 * something presentable with any subset of fields missing — couples publish
 * half-finished drafts and old documents never break.
 */
export type TemplateProps = {
  invitation: Invitation;
  /** Leniently-parsed design fields; every one of them may be absent. */
  fields: InvitationDesignFields;
  /** Hero image S3 key, already validated against the invitation's own prefix. */
  heroKey: string | undefined;
};
