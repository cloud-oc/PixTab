import { describe, expect, it } from "vitest";
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
    const preferenceStore = {
      read: async () => ({ reverseProxyDomain: "" }),
      write: async () => undefined
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
  });
});
