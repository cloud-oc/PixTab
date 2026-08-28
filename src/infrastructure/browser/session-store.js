import { storageSessionGet, storageSessionSet } from "../../shared/browser-polyfill.js";

export const sessionStore = Object.freeze({
  get: (keys) => storageSessionGet(keys),
  set: (values) => storageSessionSet(values)
});
