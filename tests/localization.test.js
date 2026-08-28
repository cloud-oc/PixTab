import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";
import { describe, expect, it, vi } from "vitest";
import { LocalizationController } from "../src/ui/options/localization.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const optionsHtml = await readFile(path.join(root, "src", "options", "options.html"), "utf8");
const languages = ["en", "zh-CN", "zh-TW", "ja", "ko", "ru"];
const localeDirectory = (language) => language.replaceAll("-", "_");
const catalogs = Object.fromEntries(await Promise.all(languages.map(async (language) => [
  localeDirectory(language),
  JSON.parse(await readFile(path.join(root, "_locales", localeDirectory(language), "messages.json"), "utf8"))
])));

function storage(language = null) {
  const values = new Map(language ? [["language", language]] : []);
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value))
  };
}

function controller(doc, overrides = {}) {
  return new LocalizationController({
    doc,
    storage: storage(),
    i18n: { getMessage: () => "" },
    runtime: { getURL: (value) => `chrome-extension://test/${value}` },
    navigatorImpl: { languages: ["en"], language: "en" },
    logger: { error: vi.fn() },
    ...overrides
  });
}

describe("LocalizationController", () => {
  it("calls an injected browser fetch without an illegal receiver", async () => {
    const dom = new JSDOM(`<h1 data-i18n="settingsHeading"></h1>
      <input data-i18n-placeholder="artistIdLabel">
      <label data-i18n-title="sizeHelper"></label>`);
    const fetchImpl = async function () {
      if (this !== undefined) throw new TypeError("Illegal invocation");
      return {
        ok: true,
        status: 200,
        json: async () => ({
          settingsHeading: { message: "Settings" },
          artistIdLabel: { message: "Artist ID" },
          sizeHelper: { message: "Image sizing help" }
        })
      };
    };

    await expect(controller(dom.window.document, { fetchImpl }).apply("en")).resolves.toBe(true);
    expect(dom.window.document.querySelector("h1").textContent).toBe("Settings");
    expect(dom.window.document.querySelector("input").placeholder).toBe("Artist ID");
    expect(dom.window.document.querySelector("label").title).toBe("Image sizing help");
  });

  it("falls through normalized, selected, and English locale paths", async () => {
    const dom = new JSDOM(`<h1 data-i18n="settingsHeading"></h1>`);
    const calls = [];
    const fetchImpl = vi.fn(async (url) => {
      calls.push(url);
      if (url.includes("/zh_CN/")) return { ok: false, status: 404 };
      if (url.includes("/zh-CN/")) {
        return { ok: true, status: 200, json: async () => { throw new SyntaxError("bad json"); } };
      }
      return { ok: true, status: 200, json: async () => catalogs.en };
    });

    await expect(controller(dom.window.document, { fetchImpl }).apply("zh-CN")).resolves.toBe(true);
    expect(calls.map((url) => new URL(url).pathname)).toEqual([
      "/_locales/zh_CN/messages.json",
      "/_locales/zh-CN/messages.json",
      "/_locales/en/messages.json"
    ]);
    expect(dom.window.document.querySelector("h1").textContent).toBe("Settings");
  });

  it("keeps browser messages visible when every locale file fails", async () => {
    const dom = new JSDOM(`<h1 data-i18n="settingsHeading"></h1>`);
    const logger = { error: vi.fn() };
    const instance = controller(dom.window.document, {
      fetchImpl: vi.fn(async () => { throw new Error("offline"); }),
      i18n: { getMessage: (key) => key === "settingsHeading" ? "Built-in Settings" : "" },
      logger
    });

    await expect(instance.apply("ko")).resolves.toBe(false);
    expect(dom.window.document.querySelector("h1").textContent).toBe("Built-in Settings");
    expect(logger.error).toHaveBeenCalledOnce();
    expect(logger.error.mock.calls[0][0]).toContain("_locales/ko/messages.json");
  });

  it.each(languages)("fills every declared settings label for %s", async (language) => {
    const dom = new JSDOM(optionsHtml);
    const instance = controller(dom.window.document, {
      fetchImpl: async (url) => {
        const directory = new URL(url).pathname.split("/")[2];
        const messages = catalogs[directory];
        return messages
          ? { ok: true, status: 200, json: async () => messages }
          : { ok: false, status: 404 };
      }
    });

    await expect(instance.apply(language)).resolves.toBe(true);
    const emptyText = [...dom.window.document.querySelectorAll("[data-i18n]")]
      .filter((element) => !element.textContent.trim())
      .map((element) => element.dataset.i18n);
    const emptyPlaceholders = [...dom.window.document.querySelectorAll("[data-i18n-placeholder]")]
      .filter((element) => !element.placeholder.trim())
      .map((element) => element.dataset.i18nPlaceholder);
    const emptyTitles = [...dom.window.document.querySelectorAll("[data-i18n-title]")]
      .filter((element) => !element.title.trim())
      .map((element) => element.dataset.i18nTitle);

    expect(emptyText).toEqual([]);
    expect(emptyPlaceholders).toEqual([]);
    expect(emptyTitles).toEqual([]);
    expect([...dom.window.document.querySelectorAll("#languageSelect option")].every((option) => option.textContent.trim())).toBe(true);
  });
});
