import { ArtworkService } from "./artwork-service.js";
import { MessageRouter } from "./message-router.js";
import { PrefetchPool } from "./prefetch-pool.js";
import { PixivAuthService } from "../infrastructure/browser/auth-service.js";
import { ConnectivityMonitor } from "../infrastructure/browser/connectivity-monitor.js";
import { PreferenceStore } from "../infrastructure/browser/preference-store.js";
import { DownloadManager } from "../infrastructure/network/download-manager.js";
import { RequestScheduler } from "../infrastructure/network/request-scheduler.js";
import { PixivClient } from "../infrastructure/pixiv/client.js";
import { ProxyPolicy } from "../infrastructure/pixiv/proxy-policy.js";
import { sessionStore } from "../shared/browser-polyfill.js";

export class BackgroundApplication {
  constructor(browserAPI) {
    this.browserAPI = browserAPI;
    this.preferences = null;
    this.preferenceStore = new PreferenceStore();
    this.proxyPolicy = new ProxyPolicy();
    this.scheduler = new RequestScheduler();
    this.downloads = new DownloadManager();
    this.client = new PixivClient({
      scheduler: this.scheduler,
      downloads: this.downloads,
      proxyPolicy: this.proxyPolicy,
      getPreferences: () => this.preferences || {},
      log: (...args) => this.preferences?.debugLogging && console.debug(...args)
    });
    this.auth = new PixivAuthService(this.client);
    this.connectivity = new ConnectivityMonitor({
      proxyPolicy: this.proxyPolicy,
      preferenceStore: this.preferenceStore
    });
    this.pool = new PrefetchPool({ sessionStore });
    this.workController = null;
    this.reloadRevision = 0;
    this.reloadTask = null;
  }

  async start() {
    this.preferences = await this.preferenceStore.read();
    await this.pool.restore();
    this.service = this.#newService();
    const service = this.service;
    this.pool.attachProducer(() => service.next());
    void this.connectivity.probe();
  }

  reload() {
    this.reloadRevision += 1;
    this.workController?.abort(new DOMException("PREFERENCES_CHANGED", "AbortError"));
    this.pool.invalidate();
    if (!this.reloadTask) this.reloadTask = this.#drainReloads();
    return this.reloadTask;
  }

  installMessageListener(ready) {
    const router = new MessageRouter({
      browserAPI: this.browserAPI,
      pool: this.pool,
      auth: this.auth,
      client: this.client,
      connectivity: this.connectivity
    });
    router.listen(ready);
  }

  async #drainReloads() {
    await new Promise((resolve) => setTimeout(resolve, 80));
    let handledRevision = 0;
    try {
      while (handledRevision < this.reloadRevision) {
        handledRevision = this.reloadRevision;
        this.preferences = await this.preferenceStore.read();
        this.service = this.#newService();
        const service = this.service;
        this.pool.attachProducer(() => service.next());
        await Promise.resolve();
      }
    } finally {
      this.reloadTask = null;
      if (handledRevision < this.reloadRevision) return this.reload();
    }
  }

  #newService() {
    this.workController?.abort(new DOMException("SOURCE_REPLACED", "AbortError"));
    this.workController = new AbortController();
    const scopedClient = this.client.scoped(this.workController.signal);
    const scopedAuth = new PixivAuthService(scopedClient);
    return new ArtworkService({ client: scopedClient, auth: scopedAuth, preferences: this.preferences });
  }
}
