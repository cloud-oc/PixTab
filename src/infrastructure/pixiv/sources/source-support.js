import { normalizeArtworkType } from "../../../domain/artwork.js";

export function randomItem(items, random = Math.random) {
  if (!items?.length) return null;
  return items[Math.floor(random() * items.length)] ?? null;
}

export function randomInteger(minimum, maximumExclusive, random = Math.random) {
  return Math.floor(random() * (maximumExclusive - minimum)) + minimum;
}

export async function repeatUntilValue(limit, operation) {
  for (let attempt = 0; attempt < limit; attempt += 1) {
    const value = await operation(attempt);
    if (value) return value;
  }
  return null;
}

export function summaryMatches(entry, preferences = {}) {
  if (preferences.aiType && entry.aiType != null && Number(entry.aiType) !== Number(preferences.aiType)) return false;
  if (preferences.minWidthPx && (!entry.width || entry.width < preferences.minWidthPx)) return false;
  if (preferences.minHeightPx && (!entry.height || entry.height < preferences.minHeightPx)) return false;
  const actualType = normalizeArtworkType(entry.illustType ?? entry.illust_type ?? entry.type);
  if (actualType && preferences.type && preferences.type !== "all") {
    const accepted = preferences.type === "illust_and_ugoira"
      ? actualType === "illust" || actualType === "ugoira"
      : actualType === preferences.type;
    if (!accepted) return false;
  }
  return true;
}
