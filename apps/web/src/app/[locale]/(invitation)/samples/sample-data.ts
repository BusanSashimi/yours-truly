import type {
  Invitation,
  InvitationDesignFields,
  InvitationTemplateId,
} from "@yours-truly/shared";

// Fixed identifiers so static generation is deterministic. Templates only read
// `invitation.id` for the (disabled) interactive sections, so a single id is
// fine; it also prefixes the shared sample photo keys below.
const SAMPLE_INVITATION_ID = "00000000-0000-4000-8000-000000000000";
const SAMPLE_TIMESTAMP = "2026-01-01T00:00:00.000Z";

// Shared sample photos (Unsplash, free license) uploaded once to the asset
// bucket under this invitation's `i/<id>/` prefix; the same set is reused
// across all 12 designs. Keys follow ASSET_KEY_REGEX (i/<uuid>/<uuid>.<ext>).
const PHOTO = (uuid: string) => `i/${SAMPLE_INVITATION_ID}/${uuid}.jpg`;
const HERO_IMAGE_KEY = PHOTO("0a9d2a03-885b-4950-8a0c-81d495897490");
const GALLERY_IMAGE_KEYS = [
  PHOTO("0b469198-b6fd-4b9b-9fa3-ab7ea99e7c83"),
  PHOTO("4dc7929b-5bdc-4a97-a502-e9ac59fe66e2"),
  PHOTO("43395d36-9c54-464b-ba64-0d32cd457a1a"),
  PHOTO("7bba2069-7f06-4fc2-9bdd-8011c0f1fdf2"),
  PHOTO("bbef9c50-cf80-4b46-b8da-455724319102"),
  PHOTO("f490fb6a-f1ac-43e2-b56c-c258a32ec806"),
];
const CLOSING_IMAGE_KEYS = [PHOTO("cbf5da2c-526e-4b1e-8ad2-9a9351db4abf")];

/**
 * Static sample content for the public design gallery (/samples). One rich
 * invitation rendered through every template so clients can browse the real
 * designs without any seeded DB rows. Photos come from a shared Unsplash set
 * (above); every interactive/API-backed section (RSVP, guestbook, guest
 * upload) is disabled so a sample page makes no network calls. The
 * per-template page overrides `template`.
 */
const SAMPLE_FIELDS: InvitationDesignFields = {
  heroImageKey: HERO_IMAGE_KEY,
  galleryImageKeys: GALLERY_IMAGE_KEYS,
  closingImageKeys: CLOSING_IMAGE_KEYS,
  groomName: "김민준",
  brideName: "이민지",
  // 2026-10-24 13:00 KST
  dateTime: "2026-10-24T04:00:00.000Z",
  venueName: "더채플앳청담",
  venueAddress: "서울 강남구 선릉로 757",
  message:
    "서로가 마주보며 다져온 사랑을\n이제 함께 한 곳을 바라보며\n걸어가고자 합니다.\n\n저희 두 사람의 첫걸음을\n축복해 주시면 감사하겠습니다.",
  quote: {
    text: "함께 있되 거리를 두라.\n그래서 하늘 바람이 너희 사이에서 춤추게 하라.",
    source: "칼릴 지브란, 「예언자」",
  },
  profiles: {
    groom: {
      role: "다정한 사랑꾼",
      birth: "1992년생",
      region: "서울",
      mbti: "ENFP",
      traits: ["요리하는 걸 좋아해요", "주말엔 등산", "강아지 바보"],
      bio: "늘 웃게 해주는 사람과 평생을 약속합니다.",
    },
    bride: {
      role: "씩씩한 산책 메이트",
      birth: "1993년생",
      region: "경기 성남",
      mbti: "ISFJ",
      traits: ["커피와 책", "필름 카메라", "느린 아침"],
      bio: "서로의 가장 든든한 친구가 되어 함께 걷겠습니다.",
    },
  },
  parents: {
    groomFather: { name: "김영수", phone: "010-0000-0001" },
    groomMother: { name: "박정희", phone: "010-0000-0002" },
    brideFather: { name: "이상호", phone: "010-0000-0003" },
    brideMother: { name: "최은영", phone: "010-0000-0004" },
  },
  contacts: [
    { label: "신랑", name: "김민준", phone: "010-0000-0010" },
    { label: "신부", name: "이민지", phone: "010-0000-0011" },
    { label: "신랑 어머니", name: "박정희", phone: "010-0000-0002" },
    { label: "신부 아버지", name: "이상호", phone: "010-0000-0003" },
  ],
  // 2019-05-20
  relationshipStartDate: "2019-05-19T15:00:00.000Z",
  timeline: [
    { date: "2019.05", label: "첫 만남", text: "친구의 소개로 작은 카페에서 처음 만났어요." },
    { date: "2021.09", label: "첫 여행", text: "함께 떠난 제주에서 평생을 약속했죠." },
    { date: "2025.12", label: "프러포즈", text: "눈 내리던 밤, 같은 마음을 확인했습니다." },
    { date: "2026.10", label: "결혼", text: "이제 부부로서의 첫걸음을 내딛습니다." },
  ],
  interview: [
    {
      question: "서로의 첫인상은 어땠나요?",
      groomAnswer: "웃는 모습이 참 맑은 사람이라고 생각했어요.",
      brideAnswer: "조용한데 은근히 다정해서 자꾸 눈이 갔어요.",
    },
    {
      question: "어떤 부부가 되고 싶나요?",
      groomAnswer: "매일 한 번씩은 꼭 웃게 해주는 사람이요.",
      brideAnswer: "서로의 속도를 존중하며 오래 걷는 부부요.",
    },
  ],
  map: {
    naverUrl: "https://map.naver.com/",
    kakaoUrl: "https://map.kakao.com/",
    tmapUrl: "https://tmap.life/",
  },
  transit: {
    subway: "7호선·분당선 강남구청역 3-4번 출구에서 도보 5분",
    bus: "간선 145, 240 / 지선 3011 — 청담동주민센터 하차",
    car: "내비게이션에 '더채플앳청담'을 검색하세요.",
    parking: "건물 지하 2시간 무료 주차 (발렛 가능)",
  },
  reception: {
    // 2026-10-24 15:00 KST
    dateTime: "2026-10-24T06:00:00.000Z",
    venue: "더채플앳청담 2층 그랜드홀",
    address: "서울 강남구 선릉로 757",
    note: "예식 후 같은 건물에서 식사가 준비되어 있습니다.",
  },
  accounts: [
    { side: "groom", relation: "신랑", bank: "신한은행", number: "110-000-000000", holder: "김민준" },
    { side: "bride", relation: "신부", bank: "국민은행", number: "000-00-000000", holder: "이민지" },
  ],
  tabs: {
    parking: { text: "건물 지하 주차장을 이용하실 수 있으며 2시간 무료입니다." },
    favor: { text: "참석해 주신 모든 분께 작은 답례품을 준비했습니다." },
    photobooth: { text: "1층 로비의 포토부스에서 즐거운 추억을 남겨보세요." },
  },
  wreathUrl: "https://www.yourstruly.it/",
  // Interactive, API-backed sections off: a sample makes no network calls.
  rsvpEnabled: false,
  guestbookEnabled: false,
};

/** Build the `Invitation` envelope a template expects for a given design. */
export function sampleInvitation(templateId: InvitationTemplateId): Invitation {
  return {
    id: SAMPLE_INVITATION_ID,
    slug: `sample-${templateId}`,
    status: "published",
    design: { ...SAMPLE_FIELDS, template: templateId },
    createdAt: SAMPLE_TIMESTAMP,
    updatedAt: SAMPLE_TIMESTAMP,
  };
}

/** The design fields for a given template (same content, template id swapped). */
export function sampleFields(templateId: InvitationTemplateId): InvitationDesignFields {
  return { ...SAMPLE_FIELDS, template: templateId };
}
