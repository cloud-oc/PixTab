import { randomInteger, randomItem, repeatUntilValue, summaryMatches } from "./source-support.js";

export class KeywordSource {
  constructor({ client, preferences, random = Math.random }) {
    this.client = client;
    this.preferences = preferences;
    this.random = random;
    this.pageCount = null;
    this.pages = new Map();
  }

  nextCandidate() {
    return repeatUntilValue(5, async () => {
      if (this.pageCount == null) {
        const initial = await this.client.search(this.preferences, 1);
        const total = initial?.body?.illust?.total;
        if (total == null) return null;
        this.pageCount = Math.ceil(total / 60);
      }
      if (!this.pageCount) return null;
      const pageNumber = randomInteger(1, this.pageCount + 1, this.random);
      let summaries = this.pages.get(pageNumber);
      if (!summaries) {
        const response = await this.client.search(this.preferences, pageNumber);
        const collection = response?.body?.illust;
        if (!collection) return null;
        this.pageCount = Math.max(this.pageCount, Math.ceil(collection.total / 60));
        summaries = collection.data.filter((entry) => summaryMatches(entry, this.preferences));
        this.pages.set(pageNumber, summaries);
      }
      const summary = randomItem(summaries, this.random);
      if (!summary) return null;
      const response = await this.client.detail(summary.id);
      return response?.body ? { detail: response.body, profileUrl: summary.profileImageUrl || null } : null;
    });
  }
}
