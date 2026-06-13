import type { InvitationTemplateId } from "@yours-truly/shared";

/**
 * Editor-facing template metadata, kept separate from the component registry
 * (index.ts) so client bundles that only show the picker don't pull in every
 * template's component. Thumbnails are top-cropped design previews in /public.
 */
export type InvitationTemplateMeta = {
  id: InvitationTemplateId;
  /** Picker label — the dashboard UI is Korean. */
  name: string;
  description: string;
  thumbnail: string;
};

export const TEMPLATE_METAS: readonly InvitationTemplateMeta[] = [
  {
    id: "ivory-editorial",
    name: "아이보리 에디토리얼",
    description: "크림빛 바탕에 폴라로이드 사진과 가벼운 산세리프, 정갈한 에디토리얼",
    thumbnail: "/templates/ivory-editorial.png",
  },
  {
    id: "periwinkle-story",
    name: "페리윙클 스토리",
    description: "화면 가득한 사진과 페리윙클 블루 포인트의 잔잔한 스토리형",
    thumbnail: "/templates/periwinkle-story.png",
  },
  {
    id: "warm-rose-film",
    name: "로즈 필름",
    description: "필름 감성의 사진과 더스티 로즈 색감, 손글씨 인사",
    thumbnail: "/templates/warm-rose-film.png",
  },
  {
    id: "save-the-date-editorial",
    name: "세이브더데이트",
    description: "잡지 표지처럼 큼직한 세리프와 인물 사진의 매거진 스타일",
    thumbnail: "/templates/save-the-date-editorial.png",
  },
  {
    id: "cobalt-italic-ivory",
    name: "코발트 세리프",
    description: "아이보리 바탕에 코발트블루 이탤릭 세리프 헤드라인",
    thumbnail: "/templates/cobalt-italic-ivory.png",
  },
  {
    id: "greenery-arch",
    name: "그리너리 아치",
    description: "꽃과 그린의 아치 아래 인물 사진, 테라코타 포인트",
    thumbnail: "/templates/greenery-arch.png",
  },
  {
    id: "terracotta-serif",
    name: "테라코타 클래식",
    description: "흰 바탕에 따뜻한 테라코타와 가운데 정렬 세리프",
    thumbnail: "/templates/terracotta-serif.png",
  },
  {
    id: "letter-seal",
    name: "레터 실링",
    description: "편지지 질감과 버건디 실링 왁스, 손편지 같은 분위기",
    thumbnail: "/templates/letter-seal.png",
  },
  {
    id: "eucalyptus-wreath",
    name: "유칼립투스 화환",
    description: "수채화 유칼립투스 화환이 이름을 감싸는 보태니컬 스타일",
    thumbnail: "/templates/eucalyptus-wreath.png",
  },
  {
    id: "sage-editorial",
    name: "세이지 에디토리얼",
    description: "세이지 그린 포인트의 차분한 에디토리얼, 세로 이름 배치",
    thumbnail: "/templates/sage-editorial.png",
  },
  {
    id: "sage-storybook",
    name: "세이지 스토리",
    description: "세이지 색감과 블러시 손글씨, 이야기가 풍성한 스토리북",
    thumbnail: "/templates/sage-storybook.png",
  },
  {
    id: "mocha-editorial",
    name: "모카 에디토리얼",
    description: "모카·아이보리 톤과 모노그램, 따뜻한 스튜디오 무드",
    thumbnail: "/templates/mocha-editorial.png",
  },
];
