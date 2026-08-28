export const MessageType = Object.freeze({
  requestArtwork: "artwork.get",
  refreshPreferences: "preferences.reload",
  checkLogin: "auth.status",
  fetchUgoira: "ugoira.fetch",
  enableProxy: "proxy.autoEnable"
});

const aliases = new Map([
  ["requestArtwork", MessageType.requestArtwork],
  ["fetchImage", MessageType.requestArtwork],
  ["refreshPreferences", MessageType.refreshPreferences],
  ["updateConfig", MessageType.refreshPreferences],
  ["checkPixivLogin", MessageType.checkLogin],
  ["fetchUgoiraZip", MessageType.fetchUgoira],
  ["enableReverseProxyAuto", MessageType.enableProxy]
]);

export function canonicalMessageType(action) {
  return aliases.get(action) ?? action;
}
