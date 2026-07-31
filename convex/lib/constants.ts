export const COC_API_BASE = "https://api.clashofclans.com/v1";
export const COC_RATE_LIMIT = 30;
export const COC_RATE_LIMIT_PERIOD_MS = 60_000;

export function encodePlayerTag(tag: string): string {
  return tag.trim().startsWith("#")
    ? encodeURIComponent(tag.trim())
    : encodeURIComponent(`#${tag.trim()}`);
}

export function normalizePlayerTag(tag: string): string {
  return tag.trim().replace(/^#/, "").toUpperCase();
}
