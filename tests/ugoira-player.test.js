import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { UgoiraPlayer } from "../src/ui/newtab/ugoira-player.js";

const ZIP_DATA_URL = "data:application/zip;base64,UEsDBBQAAAAIAGWRH11nKvAQBgAAAAQAAAAKAAAAMDAwMDAxLmpwZ/t/4/9NAFBLAQIUABQAAAAIAGWRH11nKvAQBgAAAAQAAAAKAAAAAAAAAAAAAAAAAAAAAAAwMDAwMDEuanBnUEsFBgAAAAABAAEAOAAAAC4AAAAAAA==";
const ZIP_BYTES = Uint8Array.from(atob(ZIP_DATA_URL.split(",")[1]), (value) => value.charCodeAt(0));
const zipResponse = () => ({ ok: true, arrayBuffer: async () => ZIP_BYTES.buffer });

describe("UgoiraPlayer", () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="container">
        <div id="backgroundImage"></div>
        <div id="foregroundImage"></div>
        <button id="playPauseButton" class="hidden"><svg><path></path></svg></button>
      </div>`;
    vi.stubGlobal("requestAnimationFrame", vi.fn(() => 1));
    vi.stubGlobal("cancelAnimationFrame", vi.fn());
    vi.stubGlobal("Image", class {
      complete = true;
      naturalWidth = 1;
      naturalHeight = 1;
      decode() { return Promise.resolve(); }
    });
    Object.defineProperties(URL, {
      createObjectURL: { configurable: true, value: vi.fn(() => "blob:ugoira-frame") },
      revokeObjectURL: { configurable: true, value: vi.fn() }
    });
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
      clearRect: vi.fn(),
      drawImage: vi.fn(),
      filter: "none"
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete URL.createObjectURL;
    delete URL.revokeObjectURL;
  });

  it("places the decoded animation above the wallpaper and reveals playback controls", async () => {
    const fetchImpl = vi.fn(function () {
      if (this !== undefined) throw new TypeError("Illegal invocation");
      return Promise.resolve(zipResponse());
    });
    const player = new UgoiraPlayer({ doc: document, fetchImpl, storageGet: vi.fn(async () => ({})) });

    await player.load({
      zipUrl: "https://i.pximg.net/ugoira.zip",
      frames: [{ file: "000001.jpg", delay: 60 }]
    });

    const canvas = document.getElementById("ugoiraCanvas");
    expect(canvas?.parentElement).toBe(document.getElementById("container"));
    expect(canvas?.style.zIndex).toBe("0");
    expect(document.getElementById("playPauseButton").classList.contains("hidden")).toBe(false);
    expect(player.playing).toBe(true);
    player.stop();
    expect(document.getElementById("playPauseButton").classList.contains("hidden")).toBe(true);
    expect(canvas?.style.display).toBe("none");
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:ugoira-frame");
    expect(player.frames).toEqual([]);
    player.destroy();
  });

  it("does not restart a stale decode after playback has been stopped", async () => {
    let finishDownload;
    let downloadSignal;
    const fetchImpl = vi.fn((url, options) => new Promise((resolve) => {
      downloadSignal = options.signal;
      finishDownload = () => resolve(zipResponse());
    }));
    const player = new UgoiraPlayer({ doc: document, fetchImpl, storageGet: vi.fn(async () => ({})) });
    const loading = player.load({
      zipUrl: "https://i.pximg.net/slow-ugoira.zip",
      frames: [{ file: "000001.jpg", delay: 60 }]
    });

    await vi.waitFor(() => expect(fetchImpl).toHaveBeenCalledOnce());
    player.stop();
    expect(downloadSignal.aborted).toBe(true);
    finishDownload();
    await loading;

    expect(player.playing).toBe(false);
    expect(player.frames).toEqual([]);
    expect(document.getElementById("playPauseButton").classList.contains("hidden")).toBe(true);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:ugoira-frame");
    player.destroy();
  });

  it("fails closed when a canvas context is unavailable", async () => {
    HTMLCanvasElement.prototype.getContext.mockReturnValueOnce(null);
    const warning = vi.spyOn(console, "warn").mockImplementation(() => {});
    const fetchImpl = vi.fn().mockResolvedValue(zipResponse());
    const player = new UgoiraPlayer({ doc: document, fetchImpl, storageGet: vi.fn(async () => ({})) });

    await player.load({
      zipUrl: "https://i.pximg.net/ugoira.zip",
      frames: [{ file: "000001.jpg", delay: 60 }]
    });

    expect(player.playing).toBe(false);
    expect(player.frames).toEqual([]);
    expect(document.getElementById("playPauseButton").classList.contains("hidden")).toBe(true);
    expect(document.getElementById("ugoiraCanvas")?.style.display).not.toBe("block");
    expect(warning).toHaveBeenCalled();
    player.destroy();
  });

  it("falls back to Pixiv when a configured image mirror cannot serve the archive", async () => {
    const fetchImpl = vi.fn()
      .mockRejectedValueOnce(new TypeError("TLS failure"))
      .mockResolvedValueOnce(zipResponse());
    const player = new UgoiraPlayer({
      doc: document,
      fetchImpl,
      storageGet: vi.fn(async () => ({ reverseProxyDomain: "i.pixiv.cat" }))
    });

    await player.load({
      zipUrl: "https://i.pximg.net/ugoira.zip",
      frames: [{ file: "000001.jpg", delay: 60 }]
    });

    expect(fetchImpl.mock.calls.map(([url]) => url)).toEqual([
      "https://i.pixiv.cat/ugoira.zip",
      "https://i.pximg.net/ugoira.zip"
    ]);
    expect(player.playing).toBe(true);
    player.destroy();
  });

  it("draws equal-aspect animation frames only once per render", async () => {
    const callbacks = [];
    vi.stubGlobal("requestAnimationFrame", vi.fn((callback) => {
      callbacks.push(callback);
      return callbacks.length;
    }));
    vi.spyOn(document.body, "getBoundingClientRect").mockReturnValue({ width: 100, height: 100 });
    const context = { clearRect: vi.fn(), drawImage: vi.fn(), filter: "none" };
    HTMLCanvasElement.prototype.getContext.mockReturnValue(context);
    const player = new UgoiraPlayer({
      doc: document,
      fetchImpl: vi.fn().mockResolvedValue(zipResponse()),
      storageGet: vi.fn(async () => ({}))
    });

    await player.load({
      zipUrl: "https://i.pximg.net/ugoira.zip",
      frames: [{ file: "000001.jpg", delay: 60 }]
    });
    callbacks[0](performance.now());

    expect(context.drawImage).toHaveBeenCalledOnce();
    player.destroy();
  });
});
