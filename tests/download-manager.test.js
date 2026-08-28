import { describe, expect, it, vi } from "vitest";
import { DownloadManager } from "../src/infrastructure/network/download-manager.js";

describe("DownloadManager", () => {
  it("does not exceed its configured concurrency", async () => {
    let active = 0;
    let maximum = 0;
    const releases = [];
    const fetchImpl = async () => {
      active += 1;
      maximum = Math.max(maximum, active);
      await new Promise((resolve) => releases.push(resolve));
      active -= 1;
      return { ok: true, blob: async () => new Blob(["ok"]) };
    };
    const downloads = new DownloadManager({ fetchImpl, concurrency: 2, retries: 0 });
    const operations = [downloads.blob("1"), downloads.blob("2"), downloads.blob("3")];
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(maximum).toBe(2);
    releases.splice(0).forEach((release) => release());
    await new Promise((resolve) => setTimeout(resolve, 0));
    releases.splice(0).forEach((release) => release());
    await Promise.all(operations);
    expect(maximum).toBe(2);
  });

  it("coalesces simultaneous downloads for the same URL", async () => {
    let release;
    const fetchImpl = vi.fn(() => new Promise((resolve) => {
      release = () => resolve({ ok: true, blob: async () => new Blob(["same"]) });
    }));
    const downloads = new DownloadManager({ fetchImpl, retries: 0 });
    const first = downloads.blob("same-url");
    const second = downloads.blob("same-url");
    expect(first).toBe(second);
    await new Promise((resolve) => setTimeout(resolve, 0));
    release();
    await Promise.all([first, second]);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("removes an aborted download from the semaphore wait queue", async () => {
    let release;
    const fetchImpl = vi.fn(() => new Promise((resolve) => {
      release = () => resolve({ ok: true, blob: async () => new Blob(["ok"]) });
    }));
    const downloads = new DownloadManager({ fetchImpl, concurrency: 1, retries: 0 });
    const first = downloads.blob("first");
    const controller = new AbortController();
    const second = downloads.blob("second", undefined, { signal: controller.signal });
    controller.abort(new DOMException("CANCELLED", "AbortError"));
    await expect(second).rejects.toMatchObject({ name: "AbortError", message: "CANCELLED" });
    release();
    await first;
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("invokes browser-native fetch without an instance receiver", async () => {
    let calls = 0;
    const fetchImpl = function () {
      if (this !== undefined) throw new TypeError("Illegal invocation");
      calls += 1;
      return Promise.resolve({ ok: true, blob: async () => new Blob(["ok"]) });
    };
    const downloads = new DownloadManager({ fetchImpl, retries: 0 });

    expect(await downloads.blob("https://example.test/image")).toBeInstanceOf(Blob);
    expect(calls).toBe(1);
  });
});
