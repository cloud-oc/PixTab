import { browserAPI } from "../../shared/browser-api.js";
import { safeCallable } from "../../shared/callable.js";

const SUPPORTED_LANGUAGES = Object.freeze(["en", "zh-CN", "zh-TW", "ja", "ko", "ru"]);

export class LocalizationController {
  constructor({
    doc = document,
    storage = localStorage,
    fetchImpl = fetch,
    i18n = browserAPI?.i18n,
    runtime = browserAPI?.runtime,
    navigatorImpl = navigator,
    logger = console
  } = {}) {
    this.doc = doc;
    this.storage = storage;
    this.fetchImpl = safeCallable(fetchImpl);
    this.getMessage = i18n?.getMessage?.bind(i18n) || (() => "");
    this.getURL = runtime?.getURL?.bind(runtime) || ((path) => `../../${path}`);
    this.navigator = navigatorImpl;
    this.logger = logger;
    this.languages = SUPPORTED_LANGUAGES;
  }

  initialize(onApplied = () => {}) {
    const select = this.doc.getElementById("languageSelect");
    if (!select) return;
    this.#applyBrowserMessages();
    const language = this.#savedLanguage() || this.#browserLanguage();
    select.value = Array.from(select.options).some((option) => option.value === language) ? language : "en";
    if (!this.storage.getItem("language")) this.storage.setItem("language", select.value);
    void this.apply(select.value).then(onApplied);
    select.addEventListener("change", () => {
      this.storage.setItem("language", select.value);
      void this.apply(select.value).then(onApplied);
    });
  }

  async apply(language) {
    const paths = [...new Set([language.replaceAll("-", "_"), language, "en"])]
      .map((name) => `_locales/${name}/messages.json`);
    const errors = [];
    for (const path of paths) {
      try {
        if (!this.fetchImpl) throw new Error("fetch is unavailable");
        const response = await this.fetchImpl(this.getURL(path));
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const messages = await response.json();
        if (!messages || typeof messages !== "object") throw new Error("invalid locale payload");
        this.#applyMessages((key) => messages[key]?.message);
        return true;
      } catch (error) {
        errors.push(`${path}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    this.#applyBrowserMessages();
    this.logger.error?.(`Unable to load PixTab locale '${language}'. ${errors.join("; ")}`);
    return false;
  }

  #applyBrowserMessages() {
    this.#applyMessages((key) => this.getMessage(key));
  }

  #applyMessages(resolveMessage) {
    this.doc.querySelectorAll("[data-i18n]").forEach((element) => {
      const message = resolveMessage(element.dataset.i18n);
      if (message) element.textContent = message;
    });
    this.doc.querySelectorAll("[data-i18n-placeholder]").forEach((element) => {
      const message = resolveMessage(element.dataset.i18nPlaceholder);
      if (message) element.placeholder = message;
    });
    this.doc.querySelectorAll("[data-i18n-title]").forEach((element) => {
      const message = resolveMessage(element.dataset.i18nTitle);
      if (message) element.title = message;
    });
  }

  #savedLanguage() {
    const saved = this.storage.getItem("language");
    const normalized = saved === "zh" ? "zh-CN" : saved;
    return this.languages.includes(normalized) ? normalized : null;
  }

  #browserLanguage() {
    for (const raw of this.navigator.languages || [this.navigator.language || "en"]) {
      const [language, region = ""] = raw.replace("_", "-").split("-");
      if (language.toLowerCase() === "zh") return ["tw", "hk", "mo"].includes(region.toLowerCase()) ? "zh-TW" : "zh-CN";
      const exact = `${language}${region ? `-${region}` : ""}`;
      if (this.languages.includes(exact)) return exact;
      if (this.languages.includes(language)) return language;
    }
    return "en";
  }
}
