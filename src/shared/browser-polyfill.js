/**
 * Browser API Polyfill
 * 统一 Chrome 和 Firefox 的扩展 API 接口
 * Firefox 原生支持 browser.* (Promise-based)
 * Chrome 使用 chrome.* (callback-based)
 */

// 检测当前浏览器环境
const isFirefox = typeof browser !== 'undefined' && browser.runtime?.id;
const isChrome = typeof chrome !== 'undefined' && chrome.runtime?.id;

// 导出统一的 API 对象
// Firefox: 优先使用原生 browser 对象
// Chrome: 使用 chrome 对象
export const browserAPI = isFirefox ? browser : chrome;

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
