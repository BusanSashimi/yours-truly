import type { ComponentType } from "react";
import { resolveInvitationTemplateId, type InvitationTemplateId } from "@yours-truly/shared";
import type { TemplateProps } from "./types";
import { ClassicTemplate } from "./classic/ClassicTemplate";
import { ModernTemplate } from "./modern/ModernTemplate";
import { RomanticTemplate } from "./romantic/RomanticTemplate";
import { MinimalTemplate } from "./minimal/MinimalTemplate";

const TEMPLATE_COMPONENTS: Record<InvitationTemplateId, ComponentType<TemplateProps>> = {
  classic: ClassicTemplate,
  modern: ModernTemplate,
  romantic: RomanticTemplate,
  minimal: MinimalTemplate,
};

/** Component for a design-doc template value; unknown/missing → default. */
export function templateComponent(value: unknown): ComponentType<TemplateProps> {
  return TEMPLATE_COMPONENTS[resolveInvitationTemplateId(value)];
}
