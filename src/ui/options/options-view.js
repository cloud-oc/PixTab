import { composeKeywordExpression } from "../../domain/search-query.js";
import { preferenceFields } from "./form-schema.js";

const KEYWORD_ORDERS = new Set(["popular_d", "popular_male_d", "popular_female_d"]);

export class OptionsView {
  constructor(doc = document) {
    this.doc = doc;
    this.loginStatus = null;
  }

  read() {
    const values = {};
    for (const [id, converter] of Object.entries(preferenceFields)) {
      const element = this.doc.getElementById(id);
      if (element) values[id] = converter.fromElement(element);
    }
    return values;
  }

  apply(values) {
    for (const [id, converter] of Object.entries(preferenceFields)) {
      const element = this.doc.getElementById(id);
      if (element) element.value = converter.toElement(values[id]);
    }
    this.ensureSelectValue("order", "ranking_daily");
    this.ensureSelectValue("s_mode", "s_tag");
    this.updateDerivedState();
  }

  ensureSelectValue(id, fallback) {
    const select = this.doc.getElementById(id);
    if (select && !Array.from(select.options).some((option) => option.value === select.value)) select.value = fallback;
  }

  updateDerivedState(changedRange = null) {
    this.updateKeywordPreview();
    this.enforceBookmarkRange(changedRange);
    const order = this.doc.getElementById("order")?.value;
    const artistGroup = this.doc.getElementById("artistIdGroup");
    if (artistGroup) artistGroup.style.display = order === "artist" ? "flex" : "none";
    this.doc.getElementById("keywordSettingsGroup")?.classList.toggle("hidden", !KEYWORD_ORDERS.has(order));
  }

  updateKeywordPreview() {
    const keyword = composeKeywordExpression({
      andKeywords: this.doc.getElementById("andKeywords")?.value,
      orKeywords: this.doc.getElementById("orKeywords")?.value,
      minusKeywords: this.doc.getElementById("minusKeywords")?.value
    });
    const preview = this.doc.getElementById("keywords");
    if (preview) preview.value = keyword;
  }

  enforceBookmarkRange(changedElement = null) {
    const minimum = this.doc.getElementById("blt");
    const maximum = this.doc.getElementById("bgt");
    if (!minimum || !maximum || minimum.value === "" || maximum.value === "") return;
    const low = Number(minimum.value);
    const high = Number(maximum.value);
    if (low <= high) return;
    if (changedElement === maximum) minimum.value = high;
    else maximum.value = low;
  }

  setLoginStatus(status) {
    this.loginStatus = status;
    const element = this.doc.getElementById("loginStatusValue");
    if (!element) return;
    const loggedInText = this.doc.getElementById("loginStatusLoggedIn")?.textContent || "Logged In";
    const loggedOutText = this.doc.getElementById("loginStatusNotLoggedIn")?.textContent || "Not Logged In";
    if (status?.loggedIn) {
      element.textContent = `${loggedInText}${status.userName ? ` (${status.userName})` : status.userId ? ` (ID: ${status.userId})` : ""}`;
      element.className = "login-status-value logged-in";
    } else {
      element.textContent = loggedOutText;
      element.className = "login-status-value not-logged-in";
    }
  }

  refreshLoginStatus() {
    if (this.loginStatus !== null) this.setLoginStatus(this.loginStatus);
  }

  setLoginLoading() {
    const element = this.doc.getElementById("loginStatusValue");
    if (element) {
      element.textContent = "·";
      element.className = "login-status-value loading";
    }
  }
}
