import { createKeywordSearchPath, createRankingQuery } from "../../domain/search-query.js";

export class PixivClient {
  #jsonInFlight = new Map();

  constructor({ scheduler, downloads, proxyPolicy, getPreferences, log = () => {} }) {
    this.scheduler = scheduler;
    this.downloads = downloads;
    this.proxyPolicy = proxyPolicy;
    this.getPreferences = getPreferences;
    this.log = log;
  }

  scoped(signal) {
    return new ScopedPixivClient(this, signal);
  }

  origin() {
    return this.proxyPolicy.apiOrigin(this.getPreferences());
  }

  json(pathOrUrl, { signal } = {}) {
    const url = pathOrUrl.startsWith("http") ? pathOrUrl : `${this.origin()}${pathOrUrl}`;
    return this.#sharedJson(url, signal, true);
  }

  search(preferences, page, options) {
    return this.json(`/ajax/search/illustrations/${createKeywordSearchPath(preferences, page)}`, options);
  }

  detail(id, options) {
    return this.json(`/ajax/illust/${id}`, options);
  }

  ugoira(id, options) {
    return this.json(`/ajax/illust/${id}/ugoira_meta`, options);
  }

  ranking(mode, page, date = null, { signal, content = null } = {}) {
    const endpoint = this.proxyPolicy.rankingUrl(this.getPreferences());
    return this.#sharedJson(`${endpoint}?${createRankingQuery(mode, page, date, content)}`, signal, false);
  }

  image(url, { signal } = {}) {
    const preferences = this.getPreferences();
    return this.downloads.blob(
      url,
      (value) => this.proxyPolicy.imageUrl(value, preferences),
      { signal }
    );
  }

  #sharedJson(url, signal, rejectApiErrors) {
    const existing = this.#jsonInFlight.get(url);
    if (existing && existing.signal === signal) return existing.promise;
    const promise = this.#readJson(url, signal, rejectApiErrors);
    this.#jsonInFlight.set(url, { promise, signal });
    promise.finally(() => {
      if (this.#jsonInFlight.get(url)?.promise === promise) this.#jsonInFlight.delete(url);
    }).catch(() => undefined);
    return promise;
  }

  async #readJson(url, signal, rejectApiErrors) {
    try {
      const response = await this.scheduler.fetch(url, { signal });
      if (!response.ok) return null;
      const payload = await response.json();
      return rejectApiErrors && payload?.error ? null : payload;
    } catch (error) {
      if (signal?.aborted) throw error;
      if (error?.message !== "PIXIV_RATE_LIMITED") this.log("Pixiv JSON request failed", error);
      return null;
    }
  }
}

class ScopedPixivClient {
  constructor(client, signal) {
    this.client = client;
    this.signal = signal;
  }

  json(pathOrUrl) { return this.client.json(pathOrUrl, { signal: this.signal }); }
  search(preferences, page) { return this.client.search(preferences, page, { signal: this.signal }); }
  detail(id) { return this.client.detail(id, { signal: this.signal }); }
  ugoira(id) { return this.client.ugoira(id, { signal: this.signal }); }
  ranking(mode, page, date = null, options = {}) {
    return this.client.ranking(mode, page, date, { ...options, signal: this.signal });
  }
  image(url) { return this.client.image(url, { signal: this.signal }); }
}
