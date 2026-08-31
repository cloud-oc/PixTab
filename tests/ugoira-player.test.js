import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { UgoiraPlayer } from "../src/ui/newtab/ugoira-player.js";

const ZIP_DATA_URL = "data:application/zip;base64,UEsDBBQAAAAIAGWRH11nKvAQBgAAAAQAAAAKAAAAMDAwMDAxLmpwZ/t/4/9NAFBLAQIUABQAAAAIAGWRH11nKvAQBgAAAAQAAAAKAAAAAAAAAAAAAAAAAAAAAAAwMDAwMDEuanBnUEsFBgAAAAABAAEAOAAAAC4AAAAAAA==";

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
    const runtime = { send: vi.fn().mockResolvedValue(ZIP_DATA_URL) };
    const player = new UgoiraPlayer({ doc: document, runtime, fetchAction: "ugoira.fetch" });

    await player.load({
      zipUrl: "https://i.pximg.net/ugoira.zip",
      frames: [{ file: "000001.jpg", delay: 60 }]
    });

    const canvas = document.getElementById("ugoiraCanvas");
    expect(canvas?.parentElement).toBe(document.getElementById("container"));
    expect(canvas?.style.zIndex).toBe("0");
    expect(document.getElementById("playPauseButton").classList.contains("hidden")).toBe(false);
    expect(player.playing).toBe(true);
    player.destroy();
  });
});
