import { randomItem, repeatUntilValue, summaryMatches } from "./source-support.js";

export class ArtistSource {
  constructor({ client, preferences, random = Math.random }) {
    this.client = client;
    this.preferences = preferences;
    this.random = random;
    this.artistIds = String(preferences.artistId || "").split(",").map((id) => id.trim()).filter(Boolean);
  }

  nextCandidate() {
    return repeatUntilValue(5, async () => {
      const artistId = randomItem(this.artistIds, this.random);
      if (!artistId) return null;
      const [works, user] = await Promise.all([
        this.client.json(`/ajax/user/${artistId}/profile/all`),
        this.client.json(`/ajax/user/${artistId}?full=1`)
      ]);
      const candidates = Object.entries(works?.body?.illusts || {})
        .filter(([, entry]) => !entry || summaryMatches(entry, this.preferences))
        .map(([id]) => id);
      const illustId = randomItem(candidates, this.random);
      if (!illustId) return null;
      const response = await this.client.detail(illustId);
      if (!response?.body) return null;
      return { detail: response.body, profileUrl: user?.body?.image || user?.body?.imageBig || null };
    });
  }
}
