import { describe, expect, it, vi } from "vitest";
import { BackgroundApplication } from "../src/application/background-application.js";

describe("BackgroundApplication artwork coordination", () => {
  it("waits for a settings reload before taking an artwork", async () => {
    let finishReload;
    const application = Object.create(BackgroundApplication.prototype);
    application.reloadRevision = 1;
    application.reloadTask = new Promise((resolve) => { finishReload = resolve; });
    application.pool = { take: vi.fn(async () => ({ illustId: "ugoira" })) };

    const request = application.requestArtwork({ advance: true });
    await Promise.resolve();
    expect(application.pool.take).not.toHaveBeenCalled();
    application.reloadTask = null;
    finishReload();

    await expect(request).resolves.toEqual({ illustId: "ugoira" });
    expect(application.pool.take).toHaveBeenCalledWith({ advance: true });
  });

  it("retries when settings change during an in-flight artwork request", async () => {
    const application = Object.create(BackgroundApplication.prototype);
    application.reloadRevision = 1;
    application.reloadTask = null;
    application.pool = {
      take: vi.fn()
        .mockImplementationOnce(async () => {
          application.reloadRevision = 2;
          return { illustId: "stale" };
        })
        .mockResolvedValueOnce({ illustId: "current" })
    };

    await expect(application.requestArtwork({ advance: false })).resolves.toEqual({ illustId: "current" });
    expect(application.pool.take).toHaveBeenCalledTimes(2);
  });
});
