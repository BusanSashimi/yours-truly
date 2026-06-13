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
