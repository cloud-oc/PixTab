import { defaultPreferences, normalizePreferences } from "../../domain/preferences.js";
import { storageLocalGet, storageLocalSet } from "../../shared/browser-polyfill.js";

export class PreferenceStore {
  async read() {
    const stored = await storageLocalGet(defaultPreferences);
    const normalized = normalizePreferences(stored);
    if (Object.keys(normalized.changes).length) await storageLocalSet(normalized.changes);
    return normalized.preferences;
  }

  write(values) {
    return storageLocalSet(values);
  }
}
