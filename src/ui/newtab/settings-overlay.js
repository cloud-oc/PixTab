import { applyTheme, getThemePreference, setThemePreference } from "../../shared/theme.js";

const OPEN_DURATION = 420;
const CLOSE_DURATION = 320;
const REDUCED_DURATION = 140;
const EASING = "cubic-bezier(0.16, 1, 0.3, 1)";

export class SettingsOverlay {
  constructor(doc = document) {
    this.doc = doc;
    this.card = doc.getElementById("illustInfo");
    this.infoView = doc.getElementById("artworkInfoView");
    this.settingsView = doc.getElementById("settingsView");
    this.overlay = doc.getElementById("settingsOverlay");
    this.frame = doc.getElementById("settingsFrame");
    this.trigger = doc.getElementById("settingsButton");
    this.themeSwitcher = doc.getElementById("overlayThemeSwitcher");
    this.state = "closed";
    this.animations = [];
  }

  bind() {
    this.trigger?.addEventListener("click", () => this.toggle());
    this.overlay?.addEventListener("click", () => this.close());
    this.doc.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && this.state !== "closed") this.close();
    });
    window.addEventListener("message", (event) => {
      if (event.data?.type === "closeOptionsPanel") this.close();
    });
    this.themeSwitcher?.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-theme-value]");
      if (!button) return;
      setThemePreference(button.dataset.themeValue);
      applyTheme(this.doc);
      this.syncTheme();
    });
    this.frame?.addEventListener("load", () => this.syncTheme());
    window.addEventListener("storage", (event) => {
      if (event.key === "themePreference") this.syncTheme();
    });
    this.syncTheme();
  }

  toggle() {
    if (this.state === "closed" || this.state === "closing") this.open();
    else this.close();
  }

  open() {
    if (!this.card || this.state === "open" || this.state === "opening") return;
    if (this.state === "closing" && this.animations.length) {
      this.state = "opening";
      this.#setExpandedA11y(true);
      this.#playAnimations(1);
      return;
    }

    this.syncTheme();
    this.card.classList.remove("unfocused");
    this.card.classList.add("focused");
    const first = this.card.getBoundingClientRect();
    const firstRadius = getComputedStyle(this.card).borderRadius;
    this.doc.body.classList.add("settings-open");
    this.overlay?.classList.add("visible");
    this.overlay?.setAttribute("aria-hidden", "false");
    this.card.classList.add("settings-expanded");
    this.#setExpandedA11y(true);
    const last = this.card.getBoundingClientRect();
    const lastRadius = getComputedStyle(this.card).borderRadius;
    this.state = "opening";
    this.#createAnimations(first, last, firstRadius, lastRadius);
    this.doc.dispatchEvent(new CustomEvent("settingscardopen"));
  }

  close() {
    if (this.state === "closed" || this.state === "closing") return;
    this.state = "closing";
    this.card?.classList.remove("settings-settled");
    this.#setExpandedA11y(false);
    if (this.animations.length) {
      this.#playAnimations(-OPEN_DURATION / CLOSE_DURATION);
      return;
    }
    const last = this.card.getBoundingClientRect();
    const lastRadius = getComputedStyle(this.card).borderRadius;
    this.card.classList.remove("settings-expanded");
    const first = this.card.getBoundingClientRect();
    const firstRadius = getComputedStyle(this.card).borderRadius;
    this.card.classList.add("settings-expanded");
    this.#createAnimations(first, last, firstRadius, lastRadius, { reversed: true });
  }

  syncTheme() {
    const preference = getThemePreference();
    this.themeSwitcher?.querySelectorAll("button[data-theme-value]").forEach((button) => {
      const active = button.dataset.themeValue === preference;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    if (this.frame?.contentDocument) applyTheme(this.frame.contentDocument);
  }

  #createAnimations(first, last, firstRadius, lastRadius, { reversed = false } = {}) {
    this.#cancelAnimations();
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const duration = reduced ? REDUCED_DURATION : OPEN_DURATION;
    this.card.style.willChange = "width, height, border-radius, box-shadow";
    const cardFrames = reduced
      ? [{ opacity: 0.92 }, { opacity: 1 }]
      : [{
          width: `${first.width}px`,
          height: `${first.height}px`,
          borderRadius: firstRadius
        }, {
          width: `${last.width}px`,
          height: `${last.height}px`,
          borderRadius: lastRadius
        }];
    const options = { duration, easing: EASING, fill: "both" };
    const cardAnimation = this.card.animate(cardFrames, options);
    this.animations = [
      cardAnimation,
      this.infoView.animate([
        { opacity: 1, offset: 0 },
        { opacity: 0, offset: 0.34 },
        { opacity: 0, offset: 1 }
      ], options),
      this.settingsView.animate([
        { opacity: 0, offset: 0 },
        { opacity: 0, offset: 0.44 },
        { opacity: 1, offset: 1 }
      ], options),
      this.themeSwitcher.animate([
        { opacity: 0, offset: 0 },
        { opacity: 0, offset: 0.56 },
        { opacity: 1, offset: 1 }
      ], options)
    ].filter(Boolean);
    cardAnimation.onfinish = () => {
      if (this.state === "closing") this.#finishClose();
      else this.#finishOpen();
    };
    if (reversed) {
      this.animations.forEach((animation) => {
        animation.pause();
        animation.currentTime = duration;
      });
      this.#playAnimations(reduced ? -1 : -OPEN_DURATION / CLOSE_DURATION);
    }
  }

  #playAnimations(rate) {
    this.animations.forEach((animation) => {
      animation.playbackRate = rate;
      animation.play();
    });
  }

  #finishOpen() {
    this.state = "open";
    this.card?.classList.add("settings-settled");
    this.#cancelAnimations();
    this.card.style.willChange = "";
    this.trigger?.focus({ preventScroll: true });
  }

  #finishClose() {
    this.state = "closed";
    this.#cancelAnimations();
    this.card?.classList.remove("settings-expanded", "settings-settled");
    this.card.style.willChange = "";
    this.doc.body.classList.remove("settings-open");
    this.overlay?.classList.remove("visible");
    this.overlay?.setAttribute("aria-hidden", "true");
    this.frame?.contentWindow?.postMessage({ type: "overlayClosed" }, "*");
    this.doc.dispatchEvent(new CustomEvent("settingscardclosed"));
    this.trigger?.focus({ preventScroll: true });
  }

  #setExpandedA11y(expanded) {
    this.trigger?.setAttribute("aria-expanded", String(expanded));
    this.trigger?.setAttribute("aria-label", expanded ? "Close settings" : "Open settings");
    this.trigger?.setAttribute("title", expanded ? "Close settings" : "Settings");
    if (expanded) {
      this.card?.setAttribute("role", "dialog");
      this.card?.setAttribute("aria-modal", "true");
      this.card?.setAttribute("aria-label", "Settings");
    } else {
      this.card?.removeAttribute("role");
      this.card?.removeAttribute("aria-modal");
      this.card?.removeAttribute("aria-label");
    }
    this.settingsView?.setAttribute("aria-hidden", String(!expanded));
    this.settingsView?.toggleAttribute("inert", !expanded);
    this.themeSwitcher?.setAttribute("aria-hidden", String(!expanded));
    this.themeSwitcher?.toggleAttribute("inert", !expanded);
  }

  #cancelAnimations() {
    this.animations.forEach((animation) => animation.cancel());
    this.animations = [];
  }

}
