import { randomInteger, randomItem, repeatUntilValue, summaryMatches } from "./source-support.js";

class AuthenticatedSource {
  constructor({ client, auth, preferences, random = Math.random }) {
    this.client = client;
    this.auth = auth;
    this.preferences = preferences;
    this.random = random;
  }

  async userId() {
    const status = await this.auth.status();
    return status.loggedIn ? status.userId : null;
  }
}

export class FollowingSource extends AuthenticatedSource {
  async nextCandidate() {
    const userId = await this.userId();
    if (!userId) return { loginRequired: true };
    return repeatUntilValue(5, async () => {
      const offset = randomInteger(0, 100, this.random);
      const listing = await this.client.json(`/ajax/user/${userId}/following?offset=${offset}&limit=24&rest=show`);
      const artist = randomItem(listing?.body?.users, this.random);
      if (!artist?.userId) return null;
      const works = await this.client.json(`/ajax/user/${artist.userId}/profile/all`);
      const illustId = randomItem(Object.keys(works?.body?.illusts || {}), this.random);
      if (!illustId) return null;
      const response = await this.client.detail(illustId);
      return response?.body ? { detail: response.body, profileUrl: artist.profileImageUrl || null } : null;
    });
  }
}

export class BookmarkSource extends AuthenticatedSource {
  async nextCandidate() {
    const userId = await this.userId();
    if (!userId) return { loginRequired: true };
    return repeatUntilValue(5, async () => {
      const offset = randomInteger(0, 200, this.random);
      const listing = await this.client.json(`/ajax/user/${userId}/illusts/bookmarks?tag=&offset=${offset}&limit=48&rest=show`);
      const works = listing?.body?.works?.filter((entry) => summaryMatches(entry, this.preferences));
      const work = randomItem(works, this.random);
      if (!work?.id) return null;
      const response = await this.client.detail(work.id);
      return response?.body ? { detail: response.body, profileUrl: work.profileImageUrl || null } : null;
    });
  }
}

export class RecommendationSource extends AuthenticatedSource {
  async nextCandidate() {
    const userId = await this.userId();
    if (!userId) return { loginRequired: true };
    return repeatUntilValue(5, async () => {
      const listing = await this.client.json("/ajax/top/illust?mode=all&lang=en");
      const thumbnails = (listing?.body?.thumbnails?.illust || [])
        .filter((entry) => summaryMatches(entry, this.preferences));
      const summary = randomItem(thumbnails, this.random);
      const recommendedId = summary?.id || randomItem(listing?.body?.page?.recommend?.ids, this.random);
      if (!recommendedId) return null;
      const response = await this.client.detail(recommendedId);
      return response?.body ? { detail: response.body, profileUrl: summary?.profileImageUrl || null } : null;
    });
  }
}
