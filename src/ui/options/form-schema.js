const nullableNumber = {
  fromElement: (element) => element.value === "" ? null : Number(element.value),
  toElement: (value) => value ?? ""
};
const text = {
  fromElement: (element) => element.value.trim(),
  toElement: (value) => value ?? ""
};
const choice = (fallback) => ({
  fromElement: (element) => element.value || fallback,
  toElement: (value) => value || fallback
});

export const preferenceFields = Object.freeze({
  order: choice("ranking_daily"),
  mode: choice("safe"),
  blt: nullableNumber,
  bgt: nullableNumber,
  s_mode: choice("s_tag"),
  type: choice("illust_and_ugoira"),
  aiType: choice("display"),
  minWidthPx: nullableNumber,
  minHeightPx: nullableNumber,
  size: choice("full"),
  align: choice("center"),
  tiling: choice("none"),
  andKeywords: text,
  orKeywords: text,
  minusKeywords: text,
  keywords: text,
  artistId: text,
  loginFallbackMode: choice("ranking_daily"),
  reverseProxyDomain: text
});
