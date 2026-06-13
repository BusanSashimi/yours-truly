import type { InvitationTemplateId } from "@yours-truly/shared";

/**
 * Editor-facing template metadata, kept separate from the component registry
 * (index.ts) so client bundles that only show the picker don't pull in every
 * template's component and styles.
 */
export type InvitationTemplateMeta = {
  id: InvitationTemplateId;
  /** Picker label — the dashboard UI is Korean. */
  name: string;
  description: string;
  /** Full-page design mock served from /public, shown top-cropped in the picker. */
  thumbnail: string;
};

export const TEMPLATE_METAS: readonly InvitationTemplateMeta[] = [
  {
    id: "classic",
    name: "클래식",
    description: "크림빛 바탕과 단정한 세리프, 격식 있는 정통 청첩장",
    thumbnail: "/templates/classic.png",
  },
  {
    id: "modern",
    name: "모던",
    description: "화면 가득한 사진 위로 이름과 날짜가 흐르는 시네마틱 스타일",
    thumbnail: "/templates/modern.png",
  },
  {
    id: "romantic",
    name: "로맨틱",
    description: "폴라로이드 사진과 따뜻한 색감, 손편지 같은 분위기",
    thumbnail: "/templates/romantic.png",
  },
  {
    id: "minimal",
    name: "미니멀",
    description: "여백과 아이콘으로 정돈된 안내 중심의 담백한 스타일",
    thumbnail: "/templates/minimal.png",
  },
];
