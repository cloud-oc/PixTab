import { abortableDelay, abortReason, createTimedSignal } from "./abort.js";
import { safeCallable } from "../../shared/browser-polyfill.js";

export class DownloadManager {
  #active = 0;
  #waiters = [];
  #inFlight = new Map();

  constructor({ fetchImpl = fetch, concurrency = 4, retries = 3, timeoutMs = 20000 } = {}) {
    this.fetchImpl = safeCallable(fetchImpl);
    this.concurrency = concurrency;
    this.retries = retries;
    this.timeoutMs = timeoutMs;
  }

  blob(url, transformUrl = (value) => value, { signal } = {}) {
    const finalUrl = transformUrl(url);
    const existing = this.#inFlight.get(finalUrl);
    if (existing && existing.signal === signal) return existing.promise;
    const promise = this.#withPermit(() => this.#download(finalUrl, 0, signal), signal);
    this.#inFlight.set(finalUrl, { promise, signal });
    promise.finally(() => {
      if (this.#inFlight.get(finalUrl)?.promise === promise) this.#inFlight.delete(finalUrl);
    }).catch(() => undefined);
    return promise;
  }

  async #withPermit(operation, signal) {
    await this.#acquire(signal);
    try {
      return await operation();
    } finally {
      this.#release();
    }
  }

  #acquire(signal) {
    if (signal?.aborted) return Promise.reject(abortReason(signal));
    if (this.#active < this.concurrency) {
      this.#active += 1;
      return Promise.resolve();
    }
    return new Promise((resolve, reject) => {
      const entry = { resolve, reject, signal, cancel: null };
      entry.cancel = () => {
        const index = this.#waiters.indexOf(entry);
        if (index >= 0) this.#waiters.splice(index, 1);
        reject(abortReason(signal));
      };
      signal?.addEventListener("abort", entry.cancel, { once: true });
      this.#waiters.push(entry);
    });
  }

  #release() {
    while (this.#waiters.length) {
      const entry = this.#waiters.shift();
      entry.signal?.removeEventListener("abort", entry.cancel);
      if (entry.signal?.aborted) continue;
      entry.resolve();
      return;
    }
    this.#active -= 1;
  }

  async #download(url, attempt, signal) {
    const timed = createTimedSignal(signal, this.timeoutMs);
    try {
      const response = await this.fetchImpl(url, { signal: timed.signal });
      if (!response.ok) throw new Error(`IMAGE_STATUS_${response.status}`);
      return await response.blob();
    } catch (error) {
      if (signal?.aborted) throw abortReason(signal);
      if (attempt >= this.retries) return null;
      await abortableDelay(Math.min(1500 * (attempt + 1), 4500), signal);
      return this.#download(url, attempt + 1, signal);
    } finally {
      timed.dispose();
    }
  }
}

export function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => resolve(reader.result), { once: true });
    reader.addEventListener("error", () => reject(reader.error), { once: true });
    reader.readAsDataURL(blob);
  });
}
