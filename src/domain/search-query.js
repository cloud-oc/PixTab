const SEARCH_KEYS = Object.freeze(["order", "mode", "p", "s_mode", "type", "blt", "bgt"]);

export function tokenizeKeywords(value) {
  return String(value ?? "").trim().split(/\s+/).filter(Boolean);
}

export function composeKeywordExpression({ andKeywords, orKeywords, minusKeywords }) {
  const required = tokenizeKeywords(andKeywords).join(" ");
  const optional = tokenizeKeywords(orKeywords);
  const excluded = tokenizeKeywords(minusKeywords);
  return [
    required,
    excluded.length ? `-${excluded.join(" -")}` : "",
    optional.length ? `(${optional.join(" OR ")})` : ""
  ].filter(Boolean).join(" ");
}

export function encodeRfc3986(value) {
  return encodeURIComponent(value).replace(/[!'()~]/g, (character) =>
    `%${character.charCodeAt(0).toString(16).toUpperCase()}`
  );
}

export function createKeywordSearchPath(preferences, page = 1) {
  const expression = composeKeywordExpression(preferences);
  const pairs = [["word", encodeRfc3986(expression)]];
  const snapshot = { ...preferences, p: page };
  for (const key of SEARCH_KEYS) {
    if (snapshot[key]) pairs.push([key, String(snapshot[key])]);
  }
  const query = pairs.map(([key, value]) => `${key}=${value}`).join("&");
  return `${encodeURIComponent(expression)}?${query}`;
}

export function createRankingQuery(mode, page, date = null) {
  const params = new URLSearchParams({ mode, format: "json", p: String(page) });
  if (date) params.set("date", date);
  return params.toString();
}
