import { composeKeywordExpression } from "../domain/search-query.js";

export function buildKeywordQuery(andKeywords, orKeywords, minusKeywords) {
  return composeKeywordExpression({ andKeywords, orKeywords, minusKeywords });
}
