const PIXIV_ORIGIN = "https://www.pixiv.net";

export class ProxyPolicy {
  constructor() {
    this.nativeReachable = true;
  }

  apiOrigin() {
    return PIXIV_ORIGIN;
  }

  rankingUrl() {
    return `${PIXIV_ORIGIN}/ranking.php`;
  }

  imageUrl(url, preferences) {
    const domain = String(preferences.reverseProxyDomain || "").trim();
    return domain && url.includes("i.pximg.net") ? url.replace("i.pximg.net", domain) : url;
  }
}

export { PIXIV_ORIGIN };
