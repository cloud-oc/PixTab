/**
 * Promise-based WebExtension APIs shared by Chrome 120+ and Firefox 140+.
 */
export const browserAPI = globalThis.browser ?? globalThis.chrome;

export const storageLocalGet = (keys) => browserAPI.storage.local.get(keys);
export const storageLocalSet = (items) => browserAPI.storage.local.set(items);

export const sessionStore = Object.freeze({
  get: (keys) => browserAPI.storage.session.get(keys),
  set: (items) => browserAPI.storage.session.set(items)
});

export default browserAPI;
