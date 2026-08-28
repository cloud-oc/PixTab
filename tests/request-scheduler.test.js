import { describe, expect, it, vi } from "vitest";
import { RequestScheduler } from "../src/infrastructure/network/request-scheduler.js";

describe("RequestScheduler", () => {
  it("retries a rate-limited request", async () => {
    vi.useFakeTimers();
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce({ status: 429 })
      .mockResolvedValueOnce({ status: 200, ok: true });
    const scheduler = new RequestScheduler({ fetchImpl, intervalMs: 1, rateLimitDelayMs: 2, retries: 1 });
    const request = scheduler.fetch("https://example.test");
    await vi.runAllTimersAsync();
    expect((await request).status).toBe(200);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
  });

  it("aborts a hanging fetch at the request timeout", async () => {
    vi.useFakeTimers();
    const fetchImpl = vi.fn((url, { signal }) => new Promise((resolve, reject) => {
      signal.addEventListener("abort", () => reject(signal.reason), { once: true });
    }));
    const scheduler = new RequestScheduler({ fetchImpl, retries: 0, timeoutMs: 50 });
    const request = scheduler.fetch("https://example.test/hang");
    const expectation = expect(request).rejects.toMatchObject({ name: "TimeoutError", message: "REQUEST_TIMEOUT" });
    await vi.advanceTimersByTimeAsync(50);
    await expectation;
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });

  it("does not start an operation aborted while queued", async () => {
    let releaseFirst;
    const fetchImpl = vi.fn()
      .mockImplementationOnce(() => new Promise((resolve) => { releaseFirst = () => resolve({ status: 200, ok: true }); }))
      .mockResolvedValue({ status: 200, ok: true });
    const scheduler = new RequestScheduler({ fetchImpl, intervalMs: 0, timeoutMs: 1000 });
    const first = scheduler.fetch("first");
    const controller = new AbortController();
    const second = scheduler.fetch("second", { signal: controller.signal });
    await new Promise((resolve) => setTimeout(resolve, 0));
    controller.abort(new DOMException("CANCELLED", "AbortError"));
    releaseFirst();
    await first;
    await expect(second).rejects.toMatchObject({ name: "AbortError", message: "CANCELLED" });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("invokes browser-native fetch without an instance receiver", async () => {
    let calls = 0;
    const fetchImpl = function () {
      if (this !== undefined) throw new TypeError("Illegal invocation");
      calls += 1;
      return Promise.resolve({ status: 200, ok: true });
    };
    const scheduler = new RequestScheduler({ fetchImpl, intervalMs: 0, retries: 0 });

    expect((await scheduler.fetch("https://example.test")).ok).toBe(true);
    expect(calls).toBe(1);
  });
});
