import { storageLocalGet } from "../../shared/browser-api.js";

const defaults = Object.freeze({ size: "best_fit", align: "center", tiling: "none" });
const sizes = Object.freeze({ original: "auto", full: "cover", best_fit: "contain" });
const alignments = Object.freeze({
  top_left: "left top", top: "center top", top_right: "right top",
  left: "left center", center: "center center", right: "right center",
  bottom_left: "left bottom", bottom: "center bottom", bottom_right: "right bottom"
});
const repeats = Object.freeze({ tile: "repeat", horizontal: "repeat-x", vertical: "repeat-y", none: "no-repeat" });

export class WallpaperRenderer {
  constructor({ foreground, background, saveTarget = null, saveableArtwork = null }) {
    this.foreground = foreground;
    this.background = background;
    this.saveTarget = saveTarget;
    this.saveableArtwork = saveableArtwork;
    this.preferences = { ...defaults };
    this.saveTarget?.addEventListener("click", (event) => event.preventDefault());
  }

  async loadPreferences() {
    const values = await storageLocalGet(defaults);
    this.preferences = { ...defaults, ...values };
    this.applyLayout();
  }

  applyChanges(changes) {
    for (const key of Object.keys(defaults)) {
      if (Object.hasOwn(changes, key)) this.preferences[key] = changes[key].newValue || defaults[key];
    }
    this.applyLayout();
  }

  applyLayout() {
    this.foreground.style.backgroundSize = sizes[this.preferences.size] || sizes.full;
    this.foreground.style.backgroundPosition = alignments[this.preferences.align] || alignments.center;
    this.foreground.style.backgroundRepeat = repeats[this.preferences.tiling] || repeats.none;
  }

  show(url, downloadUrl = url) {
    const image = `url(${url})`;
    this.background.style.backgroundImage = image;
    this.foreground.style.backgroundImage = image;
    if (this.saveableArtwork) this.saveableArtwork.src = url;
    if (this.saveTarget) this.saveTarget.href = downloadUrl || url;
  }
}
