export class ConnectivityMonitor {
  constructor({ proxyPolicy, preferenceStore, fetchImpl = fetch, intervalMs = 600_000, now = Date.now }) {
    this.proxyPolicy = proxyPolicy;
    this.preferenceStore = preferenceStore;
    this.fetchImpl = (...args) => fetchImpl(...args);
    this.intervalMs = intervalMs;
    this.now = now;
    this.lastProbe = 0;
  }

  async probe({ force = false } = {}) {
    const timestamp = this.now();
    if (!force && timestamp - this.lastProbe < this.intervalMs && timestamp >= this.lastProbe) {
      return this.proxyPolicy.nativeReachable;
    }
    this.lastProbe = timestamp;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    try {
      await this.fetchImpl("https://www.pixiv.net/favicon.ico", {
        mode: "no-cors",
        cache: "no-store",
        signal: controller.signal
      });
      this.proxyPolicy.nativeReachable = true;
      const preferences = await this.preferenceStore.read();
      if (preferences.reverseProxyDomain === "i.pixiv.re") {
        await this.preferenceStore.write({ reverseProxyDomain: "" });
      }
    } catch {
      this.proxyPolicy.nativeReachable = false;
      const preferences = await this.preferenceStore.read();
      if (!String(preferences.reverseProxyDomain || "").trim()) {
        await this.preferenceStore.write({ reverseProxyDomain: "i.pixiv.re" });
      }
    } finally {
      clearTimeout(timeout);
    }
    return this.proxyPolicy.nativeReachable;
  }

  async enableDefaultProxy() {
    const preferences = await this.preferenceStore.read();
    if (String(preferences.reverseProxyDomain || "").trim()) {
      return { success: false, reason: "already_enabled" };
    }
    await this.preferenceStore.write({ reverseProxyDomain: "i.pixiv.re" });
    return { success: true };
  }
}
