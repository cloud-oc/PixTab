import { defaultPreferences, normalizePreferences } from "../../domain/preferences.js";
import { storageLocalGet, storageLocalSet } from "../../shared/browser-api.js";

export class PreferenceStore {
  async read() {
    const stored = await storageLocalGet(defaultPreferences);
    return normalizePreferences(stored);
  }

  write(values) {
    return storageLocalSet(values);
  }
}
