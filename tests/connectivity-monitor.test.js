import { describe, expect, it, vi } from "vitest";
import { ConnectivityMonitor } from "../src/infrastructure/browser/connectivity-monitor.js";

describe("ConnectivityMonitor", () => {
  it("invokes browser-native fetch without an instance receiver", async () => {
    let calls = 0;
    const fetchImpl = function () {
      if (this !== undefined) throw new TypeError("Illegal invocation");
      calls += 1;
      return Promise.resolve({ ok: true });
    };
    const proxyPolicy = { nativeReachable: false };
    const write = vi.fn(async () => undefined);
    const preferenceStore = {
      read: async () => ({ reverseProxyDomain: "" }),
      write
    };
    const monitor = new ConnectivityMonitor({
      proxyPolicy,
      preferenceStore,
      fetchImpl,
      intervalMs: 0,
      now: () => 1
    });

    expect(await monitor.probe()).toBe(true);
    expect(proxyPolicy.nativeReachable).toBe(true);
    expect(calls).toBe(1);
    expect(write).not.toHaveBeenCalled();
  });

  it("does not clear a configured image proxy when the Pixiv API is reachable", async () => {
    const write = vi.fn(async () => undefined);
    const monitor = new ConnectivityMonitor({
      proxyPolicy: { nativeReachable: false },
      preferenceStore: {
        read: async () => ({ reverseProxyDomain: "i.pixiv.re" }),
        write
      },
      fetchImpl: async () => ({ ok: true }),
      intervalMs: 0,
      now: () => 1
    });

    await monitor.probe();

    expect(write).not.toHaveBeenCalled();
  });
});
