export class ArtworkView {
  constructor(doc = document) {
    this.doc = doc;
    this.container = doc.getElementById("container");
    this.spinner = doc.getElementById("loadingSpinner");
    this.info = doc.getElementById("illustInfo");
    this.refreshButton = doc.getElementById("refreshButton");
    this.avatar = doc.getElementById("avatar");
    this.avatarImage = doc.getElementById("avatarImage");
    this.titleAnchor = doc.querySelector("#illustTitle a");
    this.artistAnchor = doc.querySelector("#illustName a");
    this.fadeTimer = null;
    this.#bindInfoFocus();
  }

  render(artwork, wallpaper) {
    this.#setShortText(this.titleAnchor, artwork.title || "", 123);
    this.#setShortText(this.artistAnchor, artwork.userName || "", 123);
    const titleBox = this.doc.getElementById("illustTitle");
    if (titleBox) titleBox.title = artwork.title || "";
    this.avatarImage.title = artwork.userName || "";
    this.titleAnchor.href = artwork.illustIdUrl || "";
    this.artistAnchor.href = artwork.userIdUrl || "";
    this.avatar.href = artwork.userIdUrl || "";
    this.avatarImage.style.backgroundImage = `url(${artwork.profileImageUrl || ""})`;
    wallpaper.show(artwork.imageObjectUrl);
    this.container.classList.remove("notReady");
    this.setLoading(false);
    this.#scheduleFade();
  }

  setLoading(active, { keepSpinner = false } = {}) {
    this.spinner?.classList.toggle("hidden", !active && !keepSpinner);
    this.refreshButton?.classList.toggle("loading", active);
    this.refreshButton?.setAttribute("aria-busy", active ? "true" : "false");
  }

  setFailure(failed) {
    this.container?.classList.toggle("load-failed", Boolean(failed));
    const core = this.doc.querySelector(".pix-spinner__core");
    if (!core) return;
    if (!failed) {
      core.style.fill = "";
      core.style.filter = "";
      return;
    }
    const computed = getComputedStyle(this.container || this.doc.body);
    const rgb = computed.getPropertyValue("--fail-red-rgb").trim();
    if (rgb) {
      core.style.fill = `rgb(${rgb})`;
      core.style.filter = `drop-shadow(0 0 30px rgb(${rgb}))`;
    } else {
      core.style.fill = computed.getPropertyValue("--spinner-core-color-fail").trim();
      core.style.filter = `drop-shadow(0 0 30px ${computed.getPropertyValue("--spinner-core-glow-fail").trim()})`;
    }
  }

  #setShortText(anchor, text, availableWidth) {
    anchor.textContent = text;
    if (anchor.scrollWidth > 133) {
      const length = Math.floor((text.length * availableWidth) / anchor.scrollWidth);
      anchor.textContent = `${text.slice(0, length)}...`;
    }
  }

  #bindInfoFocus() {
    const focus = () => {
      this.info.className = "focused";
      clearTimeout(this.fadeTimer);
    };
    this.info?.addEventListener("mouseenter", focus);
    this.info?.addEventListener("mouseover", focus);
    this.info?.addEventListener("mouseleave", () => this.#scheduleFade());
    this.info?.addEventListener("click", (event) => event.stopPropagation());
  }

  #scheduleFade() {
    clearTimeout(this.fadeTimer);
    this.fadeTimer = setTimeout(() => { this.info.className = "unfocused"; }, 10_000);
  }
}
