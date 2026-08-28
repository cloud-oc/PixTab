const PIXIV_ORIGIN = "https://www.pixiv.net";

export class ProxyPolicy {
  constructor() {
    this.nativeReachable = true;
  }

  apiOrigin(preferences) {
    const domain = String(preferences.reverseProxyDomain || "").trim();
    return !this.nativeReachable && domain ? `https://${domain}` : PIXIV_ORIGIN;
  }

  rankingUrl(preferences) {
    const domain = String(preferences.reverseProxyDomain || "").trim();
    return domain ? `https://${domain}/ranking.php` : `${PIXIV_ORIGIN}/ranking.php`;
  }

  imageUrl(url, preferences) {
    const domain = String(preferences.reverseProxyDomain || "").trim();
    return domain && url.includes("i.pximg.net") ? url.replace("i.pximg.net", domain) : url;
  }
}

export { PIXIV_ORIGIN };
