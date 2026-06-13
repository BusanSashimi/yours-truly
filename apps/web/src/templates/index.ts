import type { ComponentType } from "react";
import { resolveInvitationTemplateId, type InvitationTemplateId } from "@yours-truly/shared";
import type { TemplateProps } from "./types";
import { IvoryEditorialTemplate } from "./ivory-editorial/IvoryEditorialTemplate";
import { PeriwinkleStoryTemplate } from "./periwinkle-story/PeriwinkleStoryTemplate";
import { WarmRoseFilmTemplate } from "./warm-rose-film/WarmRoseFilmTemplate";
import { SaveTheDateEditorialTemplate } from "./save-the-date-editorial/SaveTheDateEditorialTemplate";
import { CobaltItalicIvoryTemplate } from "./cobalt-italic-ivory/CobaltItalicIvoryTemplate";
import { GreeneryArchTemplate } from "./greenery-arch/GreeneryArchTemplate";
import { TerracottaSerifTemplate } from "./terracotta-serif/TerracottaSerifTemplate";
import { LetterSealTemplate } from "./letter-seal/LetterSealTemplate";
import { EucalyptusWreathTemplate } from "./eucalyptus-wreath/EucalyptusWreathTemplate";
import { SageEditorialTemplate } from "./sage-editorial/SageEditorialTemplate";
import { SageStorybookTemplate } from "./sage-storybook/SageStorybookTemplate";
import { MochaEditorialTemplate } from "./mocha-editorial/MochaEditorialTemplate";

const TEMPLATE_COMPONENTS: Record<InvitationTemplateId, ComponentType<TemplateProps>> = {
  "ivory-editorial": IvoryEditorialTemplate,
  "periwinkle-story": PeriwinkleStoryTemplate,
  "warm-rose-film": WarmRoseFilmTemplate,
  "save-the-date-editorial": SaveTheDateEditorialTemplate,
  "cobalt-italic-ivory": CobaltItalicIvoryTemplate,
  "greenery-arch": GreeneryArchTemplate,
  "terracotta-serif": TerracottaSerifTemplate,
  "letter-seal": LetterSealTemplate,
  "eucalyptus-wreath": EucalyptusWreathTemplate,
  "sage-editorial": SageEditorialTemplate,
  "sage-storybook": SageStorybookTemplate,
  "mocha-editorial": MochaEditorialTemplate,
};

/** Component for a design-doc template value; unknown/missing → default. */
export function templateComponent(value: unknown): ComponentType<TemplateProps> {
  return TEMPLATE_COMPONENTS[resolveInvitationTemplateId(value)];
}
