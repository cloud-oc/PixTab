export function buildKeywordQuery(allKeywords, anyKeywords, excludedKeywords) {
    const allTokens = sanitizeKeywordInput(allKeywords);
    const anyTokens = sanitizeKeywordInput(anyKeywords);
    const excludedTokens = sanitizeKeywordInput(excludedKeywords);

    const mustInclude = allTokens.length ? allTokens.join(" ") : "";
    const optionalGroup = anyTokens.length ? `(${anyTokens.join(" OR ")})` : "";
    const excludedGroup = excludedTokens.length ? `-${excludedTokens.join(" -")}` : "";

    return [mustInclude, excludedGroup, optionalGroup].filter(Boolean).join(" ");
}

function sanitizeKeywordInput(input = "") {
    return String(input)
        .trim()
        .split(/\s+/)
        .filter(Boolean);
}
