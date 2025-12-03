import { defaultPreferences } from "./preferences.js";

export async function loadPreferences(storage = chrome.storage?.local) {
    return getAll(storage, defaultPreferences);
}

export async function savePreferences(preferences, storage = chrome.storage?.local) {
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
