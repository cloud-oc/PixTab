import { beforeEach, describe, expect, it, vi } from "vitest";
import { ArtworkView } from "../src/ui/newtab/artwork-view.js";
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
});
