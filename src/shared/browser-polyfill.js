/**
 * Browser API Polyfill
 * 统一 Chrome 和 Firefox 的扩展 API 接口
 * Firefox 原生支持 browser.* (Promise-based)
 * Chrome 使用 chrome.* (callback-based)
 */

// 检测当前浏览器环境
const isFirefox = typeof browser !== 'undefined' && browser.runtime?.id;
const isChrome = typeof chrome !== 'undefined' && chrome.runtime?.id;
const inExtensionContext = isFirefox || isChrome;

// Web fallback implementation using localStorage and simple eventing
function createWebStorageFallback() {
    const listeners = [];
    function parseValue(v) {
        try { return JSON.parse(v); } catch (e) { return v; }
    }
    function toStoredValue(v) {
        return JSON.stringify(v);
    }
    return {
        local: {
            get(keys, cb) {
                const result = {};
                if (!keys) {
                    // return everything
                    for (const k in localStorage) {
                        result[k] = parseValue(localStorage.getItem(k));
                    }
                } else if (typeof keys === 'string') {
                    result[keys] = parseValue(localStorage.getItem(keys));
                } else if (Array.isArray(keys)) {
                    for (const key of keys) {
                        result[key] = parseValue(localStorage.getItem(key));
                    }
                } else if (typeof keys === 'object') {
                    for (const key in keys) {
                        const def = keys[key];
                        const stored = parseValue(localStorage.getItem(key));
                        result[key] = stored === null || stored === undefined ? def : stored;
                    }
                }
                if (typeof cb === 'function') cb(result);
                return Promise.resolve(result);
            },
            set(items, cb) {
                const changes = {};
                for (const k in items) {
                    const old = parseValue(localStorage.getItem(k));
                    localStorage.setItem(k, toStoredValue(items[k]));
                    changes[k] = { oldValue: old, newValue: items[k] };
                }
                // notify listeners
                listeners.forEach((l) => l(changes, 'local'));
                if (typeof cb === 'function') cb();
                return Promise.resolve();
            },
            onChanged: {
                addListener(fn) { listeners.push(fn); },
                removeListener(fn) {
                    const idx = listeners.indexOf(fn);
                    if (idx >= 0) listeners.splice(idx, 1);
                }
            }
        },
        session: {
            get(keys, cb) {
                // session fallback -> use sessionStorage
                const result = {};
                if (!keys) {
                    for (const k in sessionStorage) {
                        result[k] = parseValue(sessionStorage.getItem(k));
                    }
                } else if (typeof keys === 'string') {
                    result[keys] = parseValue(sessionStorage.getItem(keys));
                } else if (Array.isArray(keys)) {
                    for (const key of keys) {
                        result[key] = parseValue(sessionStorage.getItem(key));
                    }
                } else if (typeof keys === 'object') {
                    for (const key in keys) {
                        const def = keys[key];
                        const stored = parseValue(sessionStorage.getItem(key));
                        result[key] = stored === null || stored === undefined ? def : stored;
                    }
                }
                if (typeof cb === 'function') cb(result);
                return Promise.resolve(result);
            },
            set(items, cb) {
                for (const k in items) {
                    sessionStorage.setItem(k, toStoredValue(items[k]));
                }
                if (typeof cb === 'function') cb();
                return Promise.resolve();
            },
            onChanged: { addListener() { }, removeListener() { } }
        }
    };
}

// 导出统一的 API 对象：优先使用 extension 环境 api，否则使用 web fallback
let exportedBrowserAPI;
if (inExtensionContext) {
    exportedBrowserAPI = isFirefox ? browser : chrome;
} else {
    exportedBrowserAPI = {
        storage: createWebStorageFallback(),
        // minimal runtime placeholder (no messaging)
        runtime: {
            onMessage: { addListener() { }, removeListener() { } },
            sendMessage: undefined,
            lastError: null
        },
        declarativeNetRequest: undefined
    };
}

export const browserAPI = exportedBrowserAPI;

// 检测是否是 Firefox 浏览器
export const IS_FIREFOX = isFirefox;

// 检测是否是 Chrome/Chromium 浏览器
export const IS_CHROME = isChrome && !isFirefox;

/**
 * 将 Chrome 风格的回调 API 包装成 Promise
 * @param {Function} fn - Chrome API 函数
 * @param  {...any} args - 函数参数
 * @returns {Promise}
 */
export function promisify(fn, ...args) {
    return new Promise((resolve, reject) => {
        fn(...args, (result) => {
            if (browserAPI.runtime.lastError) {
                reject(new Error(browserAPI.runtime.lastError.message));
            } else {
                resolve(result);
            }
        });
    });
}

/**
 * 获取扩展 ID（兼容 Chrome 和 Firefox）
 */
export function getExtensionId() {
    return browserAPI.runtime.id;
}

/**
 * 包装 storage.local.get 为 Promise
 */
export function storageLocalGet(keys) {
    if (IS_FIREFOX) {
        return browserAPI.storage.local.get(keys);
    }
    return promisify(browserAPI.storage.local.get.bind(browserAPI.storage.local), keys);
}

/**
 * 包装 storage.local.set 为 Promise
 */
export function storageLocalSet(items) {
    if (IS_FIREFOX) {
        return browserAPI.storage.local.set(items);
    }
    return promisify(browserAPI.storage.local.set.bind(browserAPI.storage.local), items);
}

/**
 * 包装 storage.session.get 为 Promise (Firefox 115+)
 */
export function storageSessionGet(keys) {
    const storage = browserAPI.storage.session;
    if (!storage) {
        // session storage 不可用时使用 local storage 作为降级
        return storageLocalGet(keys);
    }
    if (IS_FIREFOX) {
        return storage.get(keys);
    }
    return promisify(storage.get.bind(storage), keys);
}

/**
 * 包装 storage.session.set 为 Promise
 */
export function storageSessionSet(items) {
    const storage = browserAPI.storage.session;
    if (!storage) {
        return storageLocalSet(items);
    }
    if (IS_FIREFOX) {
        return storage.set(items);
    }
    return promisify(storage.set.bind(storage), items);
}

// 默认导出 browserAPI 以便直接使用
export default browserAPI;
