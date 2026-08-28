import { describe, expect, it, vi } from "vitest";
import { SourceCatalog } from "../src/application/source-catalog.js";
import { defaultPreferences } from "../src/domain/preferences.js";
import { ProxyPolicy } from "../src/infrastructure/pixiv/proxy-policy.js";
import { ArtistSource } from "../src/infrastructure/pixiv/sources/artist-source.js";
import { BookmarkSource, FollowingSource, RecommendationSource } from "../src/infrastructure/pixiv/sources/account-sources.js";
import { KeywordSource } from "../src/infrastructure/pixiv/sources/keyword-source.js";
import { RankingSource } from "../src/infrastructure/pixiv/sources/ranking-source.js";

const client = {};
const auth = {};

describe("SourceCatalog", () => {
  it.each([
    ["popular_d", KeywordSource],
    ["ranking_daily", RankingSource],
    ["artist", ArtistSource],
    ["following", FollowingSource],
    ["bookmarks", BookmarkSource],
    ["recommendations", RecommendationSource]
  ])("routes %s to its independent adapter", (order, SourceType) => {
    const catalog = new SourceCatalog({ client, auth, preferences: { ...defaultPreferences, order } });
    expect(catalog.primary).toBeInstanceOf(SourceType);
  });

  it("uses the configured ranking fallback when login is unavailable", async () => {
    const fallbackClient = {
      ranking: async () => ({ date: "20260827", rank_total: 1, contents: [{ illust_id: "42" }] }),
      detail: async () => ({ body: { illustId: "42" } })
    };
    const fallbackAuth = { status: async () => ({ loggedIn: false }) };
    const catalog = new SourceCatalog({
      client: fallbackClient,
      auth: fallbackAuth,
      preferences: { ...defaultPreferences, order: "following", loginFallbackMode: "ranking_daily" },
      random: () => 0
    });
    expect(await catalog.nextCandidate()).toEqual({ detail: { illustId: "42" }, profileUrl: null });
  });
});

describe("ProxyPolicy", () => {
  it("preserves native API preference and rewrites image/ranking URLs compatibly", () => {
    const policy = new ProxyPolicy();
    const preferences = { reverseProxyDomain: "i.pixiv.re" };
    expect(policy.apiOrigin(preferences)).toBe("https://www.pixiv.net");
    expect(policy.rankingUrl(preferences)).toBe("https://www.pixiv.net/ranking.php");
    expect(policy.imageUrl("https://i.pximg.net/img.jpg", preferences)).toBe("https://i.pixiv.re/img.jpg");
    policy.nativeReachable = false;
    expect(policy.apiOrigin(preferences)).toBe("https://www.pixiv.net");
  });
});

describe("RankingSource", () => {
  it("deduplicates concurrent requests for the same ranking page", async () => {
    const ranking = vi.fn(async () => ({
      date: "20260828",
      rank_total: 1,
      contents: [{ illust_id: "42" }]
    }));
    const source = new RankingSource({
      client: { ranking, detail: async () => ({ body: { illustId: "42" } }) },
      preferences: defaultPreferences,
      rankingMode: "daily",
      random: () => 0
    });

    await Promise.all([source.nextCandidate(), source.nextCandidate()]);

    expect(ranking).toHaveBeenCalledOnce();
  });
});
