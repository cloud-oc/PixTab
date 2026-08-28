import { describe, expect, it } from "vitest";
import { acceptsArtwork, createArtworkDto, createUgoiraDto, normalizeArtworkType } from "../src/domain/artwork.js";
import { canonicalMessageType, MessageType } from "../src/domain/messages.js";
import { defaultPreferences, normalizePreferences, resolveRankingName } from "../src/domain/preferences.js";
import { composeKeywordExpression, createKeywordSearchPath, encodeRfc3986 } from "../src/domain/search-query.js";

describe("preferences", () => {
  it("keeps the persisted schema and migrates legacy values", () => {
    const { preferences, changes } = normalizePreferences({ order: "date_d", s_mode: "s_tc", aiType: "hide" });
    expect(preferences).toMatchObject({ order: "ranking_daily", s_mode: "s_tag", aiType: null });
    expect(changes).toEqual({ order: "ranking_daily", s_mode: "s_tag", aiType: null });
    expect(defaultPreferences.reverseProxyDomain).toBe("");
  });

  it("resolves safe and R18 ranking modes", () => {
    expect(resolveRankingName("ranking_weekly", "safe")).toBe("weekly");
    expect(resolveRankingName("ranking_weekly", "r18")).toBe("weekly_r18");
    expect(resolveRankingName("popular_d", "safe")).toBeNull();
  });
});

describe("search query", () => {
  const input = { andKeywords: "cat blue", orKeywords: "sky sea", minusKeywords: "AI manga" };

  it("composes the established Pixiv keyword expression", () => {
    expect(composeKeywordExpression(input)).toBe("cat blue -AI -manga (sky OR sea)");
  });

  it("uses RFC3986 escaping for the word parameter", () => {
    expect(encodeRfc3986("a(b)!~")).toBe("a%28b%29%21%7E");
    expect(createKeywordSearchPath({ ...input, order: "popular_d", mode: "safe", s_mode: "s_tag" }, 3))
      .toContain("?word=cat%20blue%20-AI%20-manga%20%28sky%20OR%20sea%29&order=popular_d&mode=safe&p=3&s_mode=s_tag");
  });
});

describe("artwork contract", () => {
  const detail = {
    illustId: "42",
    userId: "7",
    userName: "Artist",
    title: "Work",
    illustType: 0,
    xRestrict: 0,
    aiType: 1,
    bookmarkCount: 5000,
    width: 1920,
    height: 1080
  };

  it("applies mode, type, dimensions, AI and bookmark filters", () => {
    const preferences = { ...defaultPreferences, aiType: 1, blt: 1000, bgt: 6000, minWidthPx: 1280 };
    expect(acceptsArtwork(detail, preferences)).toBe(true);
    expect(acceptsArtwork({ ...detail, xRestrict: 1 }, preferences)).toBe(false);
    expect(acceptsArtwork({ ...detail, width: 800 }, preferences)).toBe(false);
    expect(normalizeArtworkType(2)).toBe("ugoira");
  });

  it("preserves the new-tab Artwork DTO shape", () => {
    expect(createArtworkDto(detail, "data:image/jpeg;base64,x", "avatar")).toEqual({
      userName: "Artist",
      userId: "7",
      userIdUrl: "https://www.pixiv.net/users/7",
      illustId: "42",
      illustIdUrl: "https://www.pixiv.net/artworks/42",
      title: "Work",
      imageObjectUrl: "data:image/jpeg;base64,x",
      profileImageUrl: "avatar"
    });
    expect(createUgoiraDto({ originalSrc: "zip", mime_type: "image/png", frames: [{ file: "1.png", delay: 60 }] }))
      .toEqual({ zipUrl: "zip", mimeType: "image/png", frames: [{ file: "1.png", delay: 60 }] });
  });
});

describe("message compatibility", () => {
  it("accepts both old and new actions", () => {
    expect(canonicalMessageType("fetchImage")).toBe(MessageType.requestArtwork);
    expect(canonicalMessageType("requestArtwork")).toBe(MessageType.requestArtwork);
    expect(canonicalMessageType(MessageType.requestArtwork)).toBe(MessageType.requestArtwork);
    expect(canonicalMessageType("updateConfig")).toBe(MessageType.refreshPreferences);
  });
});
