import { beforeEach, describe, expect, it, vi } from "vitest";
import { ArtworkView } from "../src/ui/newtab/artwork-view.js";
import { NewTabController } from "../src/ui/newtab/newtab-controller.js";
import { WallpaperRenderer } from "../src/ui/newtab/wallpaper-renderer.js";
import { CustomSelect } from "../src/ui/options/custom-select.js";
import { OptionsController } from "../src/ui/options/options-controller.js";
import { OptionsView } from "../src/ui/options/options-view.js";

describe("OptionsView", () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <select id="order"><option value="ranking_daily">daily</option><option value="artist">artist</option><option value="popular_d">popular</option></select>
      <select id="mode"><option value="safe">safe</option></select>
      <select id="s_mode"><option value="s_tag">tag</option></select>
      <select id="type"><option value="illust_and_ugoira">all</option></select>
      <select id="aiType"><option value="display">display</option></select>
      <input id="blt"><input id="bgt"><input id="minWidthPx"><input id="minHeightPx">
      <input id="andKeywords"><input id="orKeywords"><input id="minusKeywords"><input id="keywords">
      <input id="artistId"><input id="reverseProxyDomain">
      <select id="size"><option value="full">full</option></select>
      <select id="align"><option value="center">center</option></select>
      <select id="tiling"><option value="none">none</option></select>
      <select id="loginFallbackMode"><option value="ranking_daily">daily</option></select>
      <div id="artistIdGroup"></div><div id="keywordSettingsGroup"></div>`;
  });

  it("uses one schema for apply and serialization", () => {
    const view = new OptionsView(document);
    view.apply({
      order: "artist", mode: "safe", s_mode: "s_tag", type: "illust_and_ugoira", aiType: "display",
      blt: 10, bgt: 20, minWidthPx: null, minHeightPx: null, andKeywords: "cat", orKeywords: "sky sea",
      minusKeywords: "AI", artistId: "7", size: "full", align: "center", tiling: "none",
      loginFallbackMode: "ranking_daily", reverseProxyDomain: ""
    });
    expect(view.read()).toMatchObject({ order: "artist", blt: 10, bgt: 20, artistId: "7" });
    expect(document.getElementById("keywords").value).toBe("cat -AI (sky OR sea)");
    expect(document.getElementById("artistIdGroup").style.display).toBe("flex");
  });

  it("keeps bookmark bounds ordered", () => {
    const view = new OptionsView(document);
    const minimum = document.getElementById("blt");
    const maximum = document.getElementById("bgt");
    minimum.value = "30";
    maximum.value = "20";
    view.enforceBookmarkRange(minimum);
    expect(maximum.value).toBe("30");
  });

  it("re-renders a cached login result after localization changes", () => {
    document.body.innerHTML = `
      <span id="loginStatusLoggedIn">Logged In</span>
      <span id="loginStatusNotLoggedIn">Not Logged In</span>
      <button id="loginStatusValue"></button>`;
    const view = new OptionsView(document);
    view.setLoginStatus({ loggedIn: true, userName: "Pixiv User" });
    document.getElementById("loginStatusLoggedIn").textContent = "已登录";
    view.refreshLoginStatus();
    expect(document.getElementById("loginStatusValue").textContent).toBe("已登录 (Pixiv User)");
  });
});

describe("OptionsController", () => {
  it("clears the loading state when the login request fails", async () => {
    document.body.innerHTML = `<button id="loginStatusValue"></button>`;
    const view = { setLoginLoading: vi.fn(), setLoginStatus: vi.fn() };
    const runtime = { send: vi.fn().mockRejectedValue(new Error("worker unavailable")) };
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const controller = new OptionsController({ doc: document, view, runtime });

    await controller.refreshLogin();

    expect(view.setLoginLoading).toHaveBeenCalledOnce();
    expect(view.setLoginStatus).toHaveBeenCalledWith({ loggedIn: false });
    expect(consoleError).toHaveBeenCalledOnce();
  });
});

describe("ArtworkView", () => {
  it("renders the stable Artwork DTO explicitly", () => {
    document.body.innerHTML = `
      <div id="container" class="notReady"><div id="loadingSpinner"></div><div class="pix-spinner__core"></div></div>
      <div id="illustInfo"><a id="avatar"><div id="avatarImage"></div></a><div id="illustTitle"><a></a></div><div id="illustName"><a></a></div></div>
      <button id="refreshButton"></button>`;
    const view = new ArtworkView(document);
    const wallpaper = { show: (url) => document.body.dataset.wallpaper = url };
    view.render({
      title: "Title", userName: "Artist", illustIdUrl: "https://example.test/work",
      userIdUrl: "https://example.test/user", profileImageUrl: "avatar", imageObjectUrl: "image"
    }, wallpaper);
    expect(document.querySelector("#illustTitle a").textContent).toBe("Title");
    expect(document.querySelector("#illustName a").textContent).toBe("Artist");
    expect(document.getElementById("container").classList.contains("notReady")).toBe(false);
    expect(document.body.dataset.wallpaper).toBe("image");
  });

  it("keeps the initial failure animation visible without leaving refresh busy", () => {
    document.body.innerHTML = `
      <div id="container" class="notReady"><div id="loadingSpinner"></div><div class="pix-spinner__core"></div></div>
      <div id="illustInfo"><a id="avatar"><div id="avatarImage"></div></a><div id="illustTitle"><a></a></div><div id="illustName"><a></a></div></div>
      <button id="refreshButton"></button>`;
    const view = new ArtworkView(document);

    view.setLoading(true);
    view.setFailure(true);
    view.setLoading(false, { keepSpinner: true });

    expect(document.getElementById("loadingSpinner").classList.contains("hidden")).toBe(false);
    expect(document.getElementById("refreshButton").classList.contains("loading")).toBe(false);
    expect(document.getElementById("refreshButton").getAttribute("aria-busy")).toBe("false");
    expect(document.getElementById("container").classList.contains("load-failed")).toBe(true);
  });

  it("reveals the artwork card again when hovered after fading", async () => {
    vi.useFakeTimers();
    document.body.innerHTML = `
      <div id="container"><div id="loadingSpinner"></div><div class="pix-spinner__core"></div></div>
      <div id="illustInfo"><a id="avatar"><div id="avatarImage"></div></a><div id="illustTitle"><a></a></div><div id="illustName"><a></a></div></div>
      <button id="refreshButton"></button>`;
    const view = new ArtworkView(document);
    view.render({ title: "Title", userName: "Artist", imageObjectUrl: "image" }, { show: vi.fn() });

    await vi.advanceTimersByTimeAsync(10_000);
    expect(document.getElementById("illustInfo").classList.contains("unfocused")).toBe(true);

    document.getElementById("illustInfo").dispatchEvent(new MouseEvent("mouseenter"));
    expect(document.getElementById("illustInfo").classList.contains("focused")).toBe(true);
    vi.useRealTimers();
  });
});

describe("CustomSelect", () => {
  it("keeps the native select as the value source", () => {
    document.body.innerHTML = `
      <label for="mode">Mode</label>
      <select id="mode"><option value="safe">Safe</option><option value="all">All</option></select>`;
    const select = document.getElementById("mode");
    const change = vi.fn();
    select.addEventListener("change", change);
    const control = new CustomSelect(select);

    control.open();
    document.querySelector('[role="option"][data-value="all"]').click();

    expect(select.value).toBe("all");
    expect(change).toHaveBeenCalledOnce();
    expect(document.querySelector(".custom-select__value").textContent).toBe("All");
    expect(document.querySelector(".custom-select__button").getAttribute("aria-expanded")).toBe("false");
  });

  it("refreshes localized option text without replacing the select", async () => {
    document.body.innerHTML = `<select id="size"><option value="full">Full</option></select>`;
    const select = document.getElementById("size");
    new CustomSelect(select);

    select.options[0].textContent = "完整显示";
    await Promise.resolve();

    expect(document.querySelector(".custom-select__value").textContent).toBe("完整显示");
    expect(document.querySelector('[role="option"]').textContent).toBe("完整显示");
  });
});

describe("WallpaperRenderer", () => {
  it("exposes the preview image and Ugoira archive to the native context menu", () => {
    const background = document.createElement("div");
    const foreground = document.createElement("div");
    const saveTarget = document.createElement("a");
    const saveableArtwork = document.createElement("img");
    const renderer = new WallpaperRenderer({ background, foreground, saveTarget, saveableArtwork });

    renderer.show("data:image/jpeg;base64,eA==", "https://example.test/ugoira.zip");

    expect(saveableArtwork.src).toBe("data:image/jpeg;base64,eA==");
    expect(saveTarget.href).toBe("https://example.test/ugoira.zip");
  });
});

describe("NewTabController", () => {
  it("advances to a new artwork when a new tab has no tab-local artwork", async () => {
    const artwork = { illustId: "fresh", imageObjectUrl: "image" };
    const runtime = { send: vi.fn().mockResolvedValue(artwork) };
    const tabStore = { getItem: vi.fn(() => null), setItem: vi.fn() };
    const api = { storage: { onChanged: { addListener: vi.fn() } } };
    const controller = new NewTabController({ doc: document, runtime, tabStore, api });
    controller.wallpaper = { loadPreferences: vi.fn() };
    controller.overlay = { bind: vi.fn() };
    controller.view = {
      container: document.createElement("div"), refreshButton: document.createElement("button"),
      setLoading: vi.fn(), setFailure: vi.fn(), render: vi.fn()
    };

    await controller.initialize();

    expect(runtime.send).toHaveBeenCalledWith(
      { action: "artwork.get", advance: true },
      { timeout: 60_000, retries: 0 }
    );
  });

  it("marks only an explicit card-button request as an artwork advance", async () => {
    const runtime = { send: vi.fn().mockResolvedValue({ illustId: "42", imageObjectUrl: "image" }) };
    const tabStore = { getItem: vi.fn(() => null), setItem: vi.fn() };
    const api = { storage: { onChanged: { addListener: vi.fn() } } };
    const controller = new NewTabController({ doc: document, runtime, tabStore, api });
    controller.view = {
      container: document.createElement("div"), refreshButton: document.createElement("button"),
      setLoading: vi.fn(), setFailure: vi.fn(), render: vi.fn()
    };
    controller.wallpaper = {};

    await controller.requestArtwork();
    await controller.requestArtwork({ advance: true });

    expect(runtime.send.mock.calls.filter(([message]) => message.action === "artwork.get").map(([message]) => message.advance))
      .toEqual([false, true]);
  });

  it("restores a tab-local artwork on reload without requesting another one", async () => {
    const artwork = { illustId: "saved", imageObjectUrl: "image" };
    const runtime = { send: vi.fn() };
    const tabStore = { getItem: vi.fn(() => JSON.stringify(artwork)), setItem: vi.fn() };
    const api = { storage: { onChanged: { addListener: vi.fn() } } };
    const controller = new NewTabController({ doc: document, runtime, tabStore, api });
    controller.wallpaper = { loadPreferences: vi.fn() };
    controller.overlay = { bind: vi.fn() };
    controller.view = {
      container: document.createElement("div"), refreshButton: document.createElement("button"),
      setLoading: vi.fn(), setFailure: vi.fn(), render: vi.fn()
    };

    await controller.initialize();

    expect(controller.view.render).toHaveBeenCalledWith(artwork, controller.wallpaper);
    expect(runtime.send).not.toHaveBeenCalled();
  });

  it("does not load the Ugoira module for static artwork", async () => {
    const playerLoader = vi.fn();
    const runtime = { send: vi.fn().mockResolvedValue({ illustId: "42" }) };
    const controller = new NewTabController({ doc: document, runtime, playerLoader });
    const container = document.createElement("div");
    controller.view = {
      container,
      refreshButton: document.createElement("button"),
      setLoading: vi.fn(),
      setFailure: vi.fn(),
      render: vi.fn()
    };
    controller.wallpaper = {};

    await controller.requestArtwork();

    expect(playerLoader).not.toHaveBeenCalled();
    expect(controller.view.render).toHaveBeenCalledOnce();
  });

  it("loads and binds one Ugoira player on first demand", async () => {
    const bind = vi.fn();
    const load = vi.fn();
    const stop = vi.fn();
    class TestPlayer {
      bind() { bind(); }
      load(payload) { load(payload); }
      stop() { stop(); }
    }
    const playerLoader = vi.fn().mockResolvedValue({ UgoiraPlayer: TestPlayer });
    const artwork = { illustId: "42", ugoira: { zipUrl: "frames.zip", frames: [{ file: "1.jpg", delay: 60 }] } };
    const runtime = { send: vi.fn().mockResolvedValue(artwork) };
    const controller = new NewTabController({ doc: document, runtime, playerLoader });
    controller.view = {
      container: document.createElement("div"),
      refreshButton: document.createElement("button"),
      setLoading: vi.fn(),
      setFailure: vi.fn(),
      render: vi.fn()
    };
    controller.wallpaper = {};

    await controller.requestArtwork();
    await controller.requestArtwork();

    expect(playerLoader).toHaveBeenCalledOnce();
    expect(bind).toHaveBeenCalledOnce();
    expect(load).toHaveBeenCalledTimes(2);
    expect(stop).toHaveBeenCalledOnce();
  });

  it("retries once when the connectivity probe already enabled the proxy", async () => {
    vi.useFakeTimers();
    const runtime = {
      send: vi.fn()
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ success: false, reason: "already_enabled" })
        .mockResolvedValueOnce({ illustId: "42" })
    };
    const controller = new NewTabController({ doc: document, runtime });
    const container = document.createElement("div");
    container.className = "notReady";
    controller.view = {
      container,
      refreshButton: document.createElement("button"),
      setLoading: vi.fn(),
      setFailure: vi.fn(),
      render: vi.fn(() => container.classList.remove("notReady"))
    };
    controller.wallpaper = {};
    controller.player = { stop: vi.fn(), load: vi.fn() };

    const request = controller.requestArtwork();
    await vi.advanceTimersByTimeAsync(500);
    await request;

    expect(runtime.send.mock.calls.map(([message]) => message.action)).toEqual([
      "artwork.get",
      "proxy.autoEnable",
      "artwork.get"
    ]);
    expect(controller.view.render).toHaveBeenCalledWith({ illustId: "42" }, controller.wallpaper);
    vi.useRealTimers();
  });
});
