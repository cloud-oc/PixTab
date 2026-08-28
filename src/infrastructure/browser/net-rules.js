const RESOURCE_TYPES = ["xmlhttprequest", "image", "media", "other"];
const PIXIV_REFERER = { header: "referer", operation: "set", value: "https://www.pixiv.net/" };
const DESKTOP_AGENT = {
  header: "user-agent",
  operation: "set",
  value: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
};

function rule(id, domain, { userAgent = false, cors = false } = {}) {
  const action = {
    type: "modifyHeaders",
    requestHeaders: userAgent ? [PIXIV_REFERER, DESKTOP_AGENT] : [PIXIV_REFERER]
  };
  if (cors) {
    action.responseHeaders = [
      { header: "access-control-allow-origin", operation: "set", value: "*" },
      { header: "access-control-allow-methods", operation: "set", value: "GET, PUT, POST, DELETE, HEAD, OPTIONS" },
      { header: "access-control-allow-headers", operation: "set", value: "*" }
    ];
  }
  return {
    id,
    priority: 10,
    action,
    condition: { urlFilter: `*://*.${domain}/*`, resourceTypes: RESOURCE_TYPES }
  };
}

export async function installNetworkRules(browserAPI) {
  const rules = [
    rule(1, "pixiv.net", { userAgent: true }),
    rule(2, "pximg.net", { userAgent: true }),
    rule(3, "pixiv.re", { userAgent: true, cors: true }),
    rule(4, "pixiv.cat", { cors: true }),
    rule(5, "pixiv.nl", { cors: true })
  ];
  await browserAPI.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: rules.map(({ id }) => id),
    addRules: rules
  });
}
