import { abortableDelay, abortReason, createTimedSignal } from "./abort.js";
import { safeCallable } from "../../shared/browser-polyfill.js";

export class RequestScheduler {
  #tail = Promise.resolve();
  #nextStart = 0;

  constructor({
    fetchImpl = fetch,
    intervalMs = 1200,
    rateLimitDelayMs = 15000,
    retries = 2,
    timeoutMs = 12000,
    now = Date.now
  } = {}) {
    this.fetchImpl = safeCallable(fetchImpl);
    this.intervalMs = intervalMs;
    this.rateLimitDelayMs = rateLimitDelayMs;
    this.retries = retries;
    this.timeoutMs = timeoutMs;
    this.now = now;
  }

  fetch(url, options = {}) {
    const operation = () => {
      if (options.signal?.aborted) throw abortReason(options.signal);
      return this.#attempt(url, options, 0);
    };
    const result = this.#tail.catch(() => undefined).then(operation);
    this.#tail = result.then(() => undefined, () => undefined);
    return result;
  }

  async #attempt(url, options, attempt) {
    const wait = this.#nextStart - this.now();
    if (wait > 0) await abortableDelay(wait, options.signal);
    const timed = createTimedSignal(options.signal, this.timeoutMs);
    try {
      const response = await this.fetchImpl(url, { ...options, signal: timed.signal });
      if (response.status === 429) {
        this.#nextStart = this.now() + this.rateLimitDelayMs;
        if (attempt < this.retries) return this.#attempt(url, options, attempt + 1);
        throw new Error("PIXIV_RATE_LIMITED");
      }
      this.#nextStart = this.now() + this.intervalMs;
      return response;
    } catch (error) {
      if (options.signal?.aborted) throw abortReason(options.signal);
      if (error?.message === "PIXIV_RATE_LIMITED" || attempt >= this.retries) throw error;
      await abortableDelay(timed.didTimeout() ? 0 : this.intervalMs, options.signal);
      return this.#attempt(url, options, attempt + 1);
    } finally {
      timed.dispose();
    }
  }
}
