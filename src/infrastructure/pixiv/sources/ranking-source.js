import { randomInteger, randomItem, repeatUntilValue, summaryMatches } from "./source-support.js";

export class RankingSource {
  constructor({ client, preferences, rankingMode, random = Math.random }) {
    this.client = client;
    this.preferences = preferences;
    this.rankingMode = rankingMode;
    this.random = random;
    this.pages = new Map();
    this.pageCount = null;
    this.date = null;
    this.previousDate = null;
    this.mayUsePreviousDate = true;
  }

  async nextCandidate() {
    const candidate = await repeatUntilValue(8, async () => {
      if (!this.pageCount) await this.#loadPage(1);
      if (!this.pageCount) return null;
      const page = randomInteger(1, this.pageCount + 1, this.random);
      const summary = randomItem(await this.#loadPage(page), this.random);
      if (!summary) return null;
      const response = await this.client.detail(summary.illust_id);
      return response?.body ? { detail: response.body, profileUrl: summary.profile_img || null } : null;
    });
    if (candidate || !this.mayUsePreviousDate || !this.previousDate) return candidate;
    this.date = this.previousDate;
    this.previousDate = null;
    this.mayUsePreviousDate = false;
    this.pageCount = null;
    this.pages.clear();
    return this.nextCandidate();
  }

  async #loadPage(page) {
    if (this.pages.has(page)) return this.pages.get(page);
    const response = await this.client.ranking(this.rankingMode, page, this.date);
    if (!response?.contents) return null;
    this.date ||= response.date || null;
    this.previousDate = response.prev_date || null;
    const itemsPerPage = response.contents.length || 50;
    this.pageCount ||= response.rank_total
      ? Math.max(1, Math.ceil(response.rank_total / itemsPerPage))
      : Math.max(1, page);
    const entries = response.contents.filter((entry) => summaryMatches(entry, this.preferences));
    this.pages.set(page, entries);
    return entries;
  }
}
