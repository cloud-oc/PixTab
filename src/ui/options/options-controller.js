import browserAPI, { storageLocalGet, storageLocalSet } from "../../shared/browser-polyfill.js";
import { MessageType } from "../../domain/messages.js";
import { defaultPreferences } from "../../domain/preferences.js";
import { RuntimeClient } from "../../infrastructure/browser/runtime-client.js";
import { applyTheme, getThemePreference, setThemePreference } from "../../shared/theme.js";
import { LocalizationController } from "./localization.js";
import { OptionsView } from "./options-view.js";

export class OptionsController {
  constructor({ doc = document, view = new OptionsView(doc), runtime = new RuntimeClient() } = {}) {
    this.doc = doc;
    this.view = view;
    this.runtime = runtime;
    this.saveTimer = null;
    this.loginTimer = null;
  }

  async initialize() {
    const values = await storageLocalGet(defaultPreferences);
    this.view.apply(values);
    this.#bindForm();
    this.#bindNavigation();
    this.#bindTheme();
    new LocalizationController({ doc: this.doc }).initialize(() => this.refreshLogin());
    await this.refreshLogin();
  }

  scheduleSave() {
    clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => void this.save(), 500);
  }

  async save() {
    this.view.updateDerivedState();
    await storageLocalSet(this.view.read());
  }

  async reset() {
    await storageLocalSet(defaultPreferences);
    this.view.apply(defaultPreferences);
  }

  async refreshLogin() {
    this.view.setLoginLoading();
    let dots = 1;
    clearInterval(this.loginTimer);
    this.loginTimer = setInterval(() => {
      const element = this.doc.getElementById("loginStatusValue");
      if (element) element.textContent = "·".repeat(dots = dots % 3 + 1);
    }, 400);
    const status = await this.runtime.send({ action: MessageType.checkLogin });
    clearInterval(this.loginTimer);
    this.view.setLoginStatus(status);
  }

  #bindForm() {
    this.doc.querySelectorAll('input:not([type="hidden"]), select, textarea').forEach((element) => {
      const event = element.tagName === "SELECT" || element.type === "checkbox" ? "change" : "input";
      element.addEventListener(event, () => this.scheduleSave());
    });
    ["andKeywords", "orKeywords", "minusKeywords"].forEach((id) => {
      this.doc.getElementById(id)?.addEventListener("input", () => this.view.updateKeywordPreview());
    });
    ["blt", "bgt"].forEach((id) => {
      const element = this.doc.getElementById(id);
      element?.addEventListener("input", () => this.view.enforceBookmarkRange(element));
      element?.addEventListener("change", () => this.view.enforceBookmarkRange(element));
    });
    this.doc.getElementById("order")?.addEventListener("change", () => this.view.updateDerivedState());
    this.doc.getElementById("reset")?.addEventListener("click", () => void this.reset());
    this.doc.getElementById("loginStatusValue")?.addEventListener("click", () => {
      browserAPI.tabs.create({ url: "https://www.pixiv.net/login.php" });
    });
  }

  #bindNavigation() {
    this.doc.getElementById("backToNewTabButton")?.addEventListener("click", () => {
      if (window.top !== window) window.parent.postMessage({ type: "closeOptionsPanel" }, "*");
      else {
        browserAPI.tabs.create({ url: "about:newtab" });
        window.close?.();
      }
    });
  }

  #bindTheme() {
    const render = () => {
      const selected = getThemePreference();
      this.doc.querySelectorAll(".theme-switcher button").forEach((button) => button.classList.remove("active"));
      const id = selected === "light" ? "themeLightBtn" : selected === "dark" ? "themeDarkBtn" : "themeAutoBtn";
      this.doc.getElementById(id)?.classList.add("active");
    };
    [["themeLightBtn", "light"], ["themeDarkBtn", "dark"], ["themeAutoBtn", "auto"]].forEach(([id, value]) => {
      this.doc.getElementById(id)?.addEventListener("click", () => {
        setThemePreference(value);
        applyTheme();
        render();
      });
    });
    render();
  }
}
