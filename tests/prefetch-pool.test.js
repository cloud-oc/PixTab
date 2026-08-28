import { describe, expect, it } from "vitest";
import { PrefetchPool } from "../src/application/prefetch-pool.js";

const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("PrefetchPool", () => {
  it("restores legacy cache and replenishes after take", async () => {
    const writes = [];
    const store = {
      get: async () => ({ artworkQueueCache: { maxsize: 8, array: [{ illustId: "cached" }] } }),
      set: async (value) => writes.push(value)
    };
    let sequence = 0;
    const pool = new PrefetchPool({ capacity: 2, concurrency: 1, sessionStore: store });
    await pool.restore();
    pool.attachProducer(async () => ({ illustId: `fresh-${++sequence}` }));
    expect((await pool.take()).illustId).toBe("cached");
    await tick();
    expect(pool.snapshot().items).toHaveLength(2);
    await pool.flushPersistence();
    expect(writes.length).toBeGreaterThan(0);
  });

  it("discards results produced by an obsolete configuration", async () => {
    let finishOld;
    const oldResult = new Promise((resolve) => { finishOld = resolve; });
    const store = { get: async () => ({}), set: async () => undefined };
    const pool = new PrefetchPool({ capacity: 1, concurrency: 1, sessionStore: store });
    pool.attachProducer(() => oldResult);
    pool.replaceProducer(async () => ({ illustId: "new" }));
    finishOld({ illustId: "old" });
    await tick();
    await tick();
    expect(pool.snapshot().items.map((item) => item.illustId)).toEqual(["new"]);
  });

  it("deduplicates queued artwork and writes one budgeted cache copy", async () => {
    const writes = [];
    const store = { get: async () => ({}), set: async (value) => writes.push(value) };
    const values = [
      { illustId: "1", imageObjectUrl: "x".repeat(80) },
      { illustId: "1", imageObjectUrl: "x".repeat(80) },
      { illustId: "2", imageObjectUrl: "x".repeat(80) }
    ];
    const pool = new PrefetchPool({
      capacity: 3,
      eagerCapacity: 3,
      concurrency: 3,
      maxPersistBytes: 300,
      persistDelayMs: 0,
      backgroundDelayMs: 10_000,
      sessionStore: store
    });
    pool.attachProducer(async () => values.shift() || null);
    await tick();
    await tick();
    expect(pool.snapshot().items.map((item) => item.illustId)).toEqual(["1", "2"]);
    await pool.flushPersistence();
    const lastWrite = writes.at(-1);
    expect(lastWrite.illustQueue).toBeNull();
    expect(lastWrite.artworkQueueCache.items).toHaveLength(1);
  });

  it("serializes cache writes so an old snapshot cannot overwrite a new one", async () => {
    let releaseFirstWrite;
    let writeCount = 0;
    const committed = [];
    const store = {
      get: async () => ({ artworkQueueCache: { items: [{ illustId: "cached" }] } }),
      set: async (value) => {
        writeCount += 1;
        if (writeCount === 1) await new Promise((resolve) => { releaseFirstWrite = resolve; });
        committed.push(value.artworkQueueCache.items.map((item) => item.illustId));
      }
    };
    const pool = new PrefetchPool({ capacity: 1, sessionStore: store });
    await pool.restore();

    const firstWrite = pool.flushPersistence();
    await tick();
    await pool.take();
    const secondWrite = pool.flushPersistence();
    releaseFirstWrite();
    await Promise.all([firstWrite, secondWrite]);

    expect(committed).toEqual([["cached"], []]);
  });

  it("invokes browser-style timer functions without an object receiver", async () => {
    const timerCalls = [];
    const setTimer = function (callback, delay) {
      if (this !== undefined) throw new TypeError("Illegal invocation");
      timerCalls.push([callback, delay]);
      return 7;
    };
    const clearTimer = function (timer) {
      if (this !== undefined) throw new TypeError("Illegal invocation");
      expect(timer).toBe(7);
    };
    const store = { get: async () => ({}), set: async () => undefined };
    const pool = new PrefetchPool({ sessionStore: store, setTimer, clearTimer });

    pool.invalidate();
    expect(timerCalls).toHaveLength(1);
    await pool.flushPersistence();
  });
});
