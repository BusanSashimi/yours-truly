import type { InvitationDesignFields } from "@yours-truly/shared";

// All formatters are pinned to Asia/Seoul so the rendered time never depends
// on the server's timezone (design docs store UTC instants; the product is
// Korean-market).
const KST = "Asia/Seoul";

/** "2026년 10월 24일" — the large display date. */
export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "long",
    timeZone: KST,
  }).format(new Date(iso));
}

/**
 * "토요일 오후 1:00" — the line under the display date. Two formatters joined
 * by hand: a single weekday+time format renders as "(토요일) 오후 1:00" in
 * ko-KR CLDR, and the parentheses read as a glitch in a display line.
 */
export function formatWeekdayTime(iso: string): string {
  const date = new Date(iso);
  const weekday = new Intl.DateTimeFormat("ko-KR", {
    weekday: "long",
    timeZone: KST,
  }).format(date);
  const time = new Intl.DateTimeFormat("ko-KR", {
    hour: "numeric",
    minute: "numeric",
    hour12: true,
    timeZone: KST,
  }).format(date);
  return `${weekday} ${time}`;
}

/** "2026.10.24" — compact numeric date for overlay layouts. */
export function formatDateNumeric(iso: string): string {
  const parts = new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: KST,
  }).formatToParts(new Date(iso));
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("year")}.${get("month")}.${get("day")}`;
}

/**
 * Naver Maps search link for the venue, or undefined when there is nothing to
 * search for. Address beats name — venue names are often ambiguous chains.
 */
export function mapSearchUrl(fields: InvitationDesignFields): string | undefined {
  const query = fields.venueAddress || fields.venueName;
  return query ? `https://map.naver.com/p/search/${encodeURIComponent(query)}` : undefined;
}

/** The wedding date's civil year/month/day in Asia/Seoul. */
function kstYmd(iso: string): { year: number; month: number; day: number } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: KST,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(iso));
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  return { year: get("year"), month: get("month"), day: get("day") };
}

/**
 * The wedding month as calendar weeks (Sun-first), 0 = blank padding cell, plus
 * the highlighted wedding day. Civil dates, so timezone only fixes which day
 * the ceremony falls on (via kstYmd).
 */
export function monthMatrix(iso: string): {
  year: number;
  month: number;
  weeks: number[][];
  weddingDay: number;
} {
  const { year, month, day } = kstYmd(iso);
  const firstWeekday = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const cells: number[] = Array.from({ length: firstWeekday }, () => 0);
  for (let d = 1; d <= daysInMonth; d += 1) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(0);
  const weeks: number[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return { year, month, weeks, weddingDay: day };
}

type CountParts = { days: number; hours: number; minutes: number; seconds: number };

/** Time remaining until `targetIso` from `nowMs`, clamped to zero. */
export function countdownParts(targetIso: string, nowMs: number): CountParts {
  const diff = Math.max(0, new Date(targetIso).getTime() - nowMs);
  const s = Math.floor(diff / 1000);
  return {
    days: Math.floor(s / 86400),
    hours: Math.floor((s % 86400) / 3600),
    minutes: Math.floor((s % 3600) / 60),
    seconds: s % 60,
  };
}

/** Whole days from the ceremony to now (negative before, e.g. D-127 → -127). */
export function dDay(targetIso: string, nowMs: number): number {
  return Math.ceil((new Date(targetIso).getTime() - nowMs) / 86_400_000);
}

/**
 * Elapsed time since `startIso` as a years/months/days breakdown (the 함께한 시간
 * counter), plus total seconds for a live ticker. Approximate calendar math —
 * good enough for a "13년 11개월 2일" display.
 */
export function sinceParts(
  startIso: string,
  nowMs: number,
): { years: number; months: number; days: number; totalSeconds: number } {
  const start = new Date(startIso);
  const now = new Date(nowMs);
  let years = now.getUTCFullYear() - start.getUTCFullYear();
  let months = now.getUTCMonth() - start.getUTCMonth();
  let days = now.getUTCDate() - start.getUTCDate();
  if (days < 0) {
    months -= 1;
    days += new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 0)).getUTCDate();
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  return {
    years: Math.max(0, years),
    months: Math.max(0, months),
    days: Math.max(0, days),
    totalSeconds: Math.max(0, Math.floor((nowMs - start.getTime()) / 1000)),
  };
}

/**
 * Navigation deep links for the venue. Prefers explicit URLs in the design's
 * map object; otherwise builds search links from the address (or name).
 */
export function navAppLinks(
  map: InvitationDesignFields["map"],
  venueName: string | undefined,
  venueAddress: string | undefined,
): { naver?: string; kakao?: string; tmap?: string } {
  const query = venueAddress || venueName;
  const q = query ? encodeURIComponent(query) : undefined;
  return {
    naver: map?.naverUrl ?? (q ? `https://map.naver.com/p/search/${q}` : undefined),
    kakao: map?.kakaoUrl ?? (q ? `https://map.kakao.com/?q=${q}` : undefined),
    tmap: map?.tmapUrl ?? (q ? `https://tmap.life/search?query=${q}` : undefined),
  };
}
