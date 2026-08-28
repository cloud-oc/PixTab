export class SettingsOverlay {
  constructor(doc = document) {
    this.doc = doc;
    this.overlay = doc.getElementById("settingsOverlay");
    this.frame = doc.getElementById("settingsFrame");
    this.trigger = doc.getElementById("settingsButton");
    this.closeButton = doc.getElementById("settingsCloseButton");
    this.content = doc.getElementById("container");
    this.focusTimer = null;
  }

  bind() {
    this.trigger?.addEventListener("click", () => this.open());
    this.closeButton?.addEventListener("click", () => this.close());
    this.overlay?.addEventListener("click", (event) => {
      if (event.target === this.overlay) this.close();
    });
    this.doc.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && this.overlay?.classList.contains("visible")) this.close();
    });
    window.addEventListener("message", (event) => {
      if (event.data?.type === "closeOptionsPanel") this.close();
    });
  }

  open() {
    this.overlay?.classList.add("visible");
    this.overlay?.setAttribute("aria-hidden", "false");
    this.doc.body.classList.add("settings-open");
    if (this.content) this.content.inert = true;
    void this.overlay?.offsetWidth;
    this.closeButton?.focus({ preventScroll: true });
    clearTimeout(this.focusTimer);
    this.focusTimer = setTimeout(() => this.closeButton?.focus({ preventScroll: true }), 50);
  }

  close() {
    this.overlay?.classList.remove("visible");
    this.overlay?.setAttribute("aria-hidden", "true");
    this.doc.body.classList.remove("settings-open");
    if (this.content) this.content.inert = false;
    clearTimeout(this.focusTimer);
    this.focusTimer = null;
    this.frame?.contentWindow?.postMessage({ type: "overlayClosed" }, "*");
    this.trigger?.focus();
  }
}
