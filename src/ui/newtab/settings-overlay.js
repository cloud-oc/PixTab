export class SettingsOverlay {
  constructor(doc = document) {
    this.doc = doc;
    this.overlay = doc.getElementById("settingsOverlay");
    this.frame = doc.getElementById("settingsFrame");
  }

  bind() {
    this.doc.getElementById("settingsButton")?.addEventListener("click", () => this.open());
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
  }

  close() {
    this.overlay?.classList.remove("visible");
    this.overlay?.setAttribute("aria-hidden", "true");
    this.doc.body.classList.remove("settings-open");
    this.frame?.contentWindow?.postMessage({ type: "overlayClosed" }, "*");
  }
}
