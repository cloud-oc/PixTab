export class LocalizationController {
  constructor({ doc = document, storage = localStorage, fetchImpl = fetch }) {
    this.doc = doc;
    this.storage = storage;
    this.fetchImpl = fetchImpl;
    this.languages = ["en", "zh-CN", "zh-TW", "ja", "ko", "ru"];
  }

  initialize(onApplied = () => {}) {
    const select = this.doc.getElementById("languageSelect");
    if (!select) return;
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
    const names = [language.replace("-", "_"), language];
    let messages = null;
    for (const name of names) {
      try {
        const response = await this.fetchImpl(`../../_locales/${name}/messages.json`);
        if (response.ok) {
          messages = await response.json();
          break;
        }
      } catch { /* try next path */ }
    }
    if (!messages) return;
    this.doc.querySelectorAll("[id]").forEach((element) => {
      if (messages[element.id]) element.textContent = messages[element.id].message;
    });
    this.doc.querySelectorAll("[data-i18n-placeholder]").forEach((element) => {
      const message = messages[element.dataset.i18nPlaceholder];
      if (message) element.placeholder = message.message;
    });
    const back = this.doc.getElementById("backToNewTabButton");
    if (back) back.title = this.doc.getElementById("backToNewTabLabel")?.textContent || "";
    const helperIds = ["size", "align", "tiling", "resolution", "aiType"];
    helperIds.forEach((name) => {
      const target = this.doc.getElementById(`${name}Label`);
      if (target) target.title = messages[`${name}Helper`]?.message || "";
    });
  }

  #savedLanguage() {
    const saved = this.storage.getItem("language");
    const normalized = saved === "zh" ? "zh-CN" : saved;
    return this.languages.includes(normalized) ? normalized : null;
  }

  #browserLanguage() {
    for (const raw of navigator.languages || [navigator.language || "en"]) {
      const [language, region = ""] = raw.replace("_", "-").split("-");
      if (language.toLowerCase() === "zh") return ["tw", "hk", "mo"].includes(region.toLowerCase()) ? "zh-TW" : "zh-CN";
      const exact = `${language}${region ? `-${region}` : ""}`;
      if (this.languages.includes(exact)) return exact;
      if (this.languages.includes(language)) return language;
    }
    return "en";
  }
}
