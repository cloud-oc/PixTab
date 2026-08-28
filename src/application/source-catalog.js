import { RankingMode, resolveRankingName } from "../domain/preferences.js";
import { ArtistSource } from "../infrastructure/pixiv/sources/artist-source.js";
import { BookmarkSource, FollowingSource, RecommendationSource } from "../infrastructure/pixiv/sources/account-sources.js";
import { KeywordSource } from "../infrastructure/pixiv/sources/keyword-source.js";
import { RankingSource } from "../infrastructure/pixiv/sources/ranking-source.js";

export class SourceCatalog {
  constructor({ client, auth, preferences, random = Math.random }) {
    this.dependencies = { client, auth, preferences, random };
    this.preferences = preferences;
    this.primary = this.#create(preferences.order);
  }

  async nextCandidate() {
    const candidate = await this.primary.nextCandidate();
    if (!candidate?.loginRequired) return candidate;
    const fallbackOrder = this.preferences.loginFallbackMode || RankingMode.daily;
    const rankingMode = resolveRankingName(fallbackOrder, this.preferences.mode) || "daily";
    return new RankingSource({ ...this.dependencies, rankingMode }).nextCandidate();
  }

  #create(order) {
    const args = this.dependencies;
    if (order === RankingMode.artist) return new ArtistSource(args);
    if (order === RankingMode.following) return new FollowingSource(args);
    if (order === RankingMode.bookmarks) return new BookmarkSource(args);
    if (order === RankingMode.recommendations) return new RecommendationSource(args);
    const rankingMode = resolveRankingName(order, this.preferences.mode);
    return rankingMode ? new RankingSource({ ...args, rankingMode }) : new KeywordSource(args);
  }
}
