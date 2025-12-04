import { defaultPreferences } from "./preferences.js";
import browserAPI from "./browser-polyfill.js";

export async function loadPreferences(storage = browserAPI.storage?.local) {
    return getAll(storage, defaultPreferences);
}

export async function savePreferences(preferences, storage = browserAPI.storage?.local) {
    if (!storage) {
        return;
    }
    return storage.set(preferences);
}

async function getAll(storage, fallback) {
    if (!storage) {
        return { ...fallback };
    }
    return new Promise((resolve) => {
        storage.get(fallback, (items) => resolve(items || { ...fallback }));
    });
}
