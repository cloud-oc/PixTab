import browserAPI from "../../shared/browser-polyfill.js";
import { MessageType } from "../../domain/messages.js";
import { RuntimeClient } from "../../infrastructure/browser/runtime-client.js";
import { ArtworkView } from "./artwork-view.js";
import { SettingsOverlay } from "./settings-overlay.js";
import { UgoiraPlayer } from "./ugoira-player.js";
import { WallpaperRenderer } from "./wallpaper-renderer.js";

export class NewTabController {
  constructor({ doc = document, runtime = new RuntimeClient() } = {}) {
    this.doc = doc;
    this.runtime = runtime;
    this.view = new ArtworkView(doc);
    this.wallpaper = new WallpaperRenderer({
      background: doc.getElementById("backgroundImage"),
      foreground: doc.getElementById("foregroundImage")
    });
    this.player = new UgoiraPlayer({ doc, runtime });
    this.overlay = new SettingsOverlay(doc);
    this.requesting = false;
  }

  initialize() {
    this.wallpaper.loadPreferences();
    this.player.bind();
    this.overlay.bind();
    this.view.refreshButton?.addEventListener("click", () => void this.requestArtwork());
    browserAPI.storage.onChanged.addListener((changes, area) => {
      if (area === "local") this.wallpaper.applyChanges(changes);
    });
    browserAPI.runtime.onMessage.addListener((message) => {
      if (message?.action === "artworkLoadFailed") this.view.setFailure(true);
      if (message?.action === "artworkLoadSucceeded") this.view.setFailure(false);
    });
    window.addEventListener("pagehide", () => this.player.destroy(), { once: true });
    return this.requestArtwork();
  }

  async requestArtwork({ allowAutomaticProxy = true } = {}) {
    if (this.requesting) return;
    this.requesting = true;
    if (this.view.container?.classList.contains("notReady")) this.view.setLoading(true);
    else this.view.refreshButton?.classList.add("loading");
    try {
      const artwork = await this.runtime.send(
        { action: MessageType.requestArtwork },
        { timeout: 15_000, retries: 1 }
      );
      if (!artwork) {
        this.view.setFailure(true);
        if (allowAutomaticProxy) {
          const enabled = await this.runtime.send({ action: MessageType.enableProxy });
          if (enabled?.success) {
            this.requesting = false;
            await new Promise((resolve) => setTimeout(resolve, 500));
            return this.requestArtwork({ allowAutomaticProxy: false });
          }
        }
        return;
      }
      this.view.setFailure(false);
      this.player.stop();
      this.view.render(artwork, this.wallpaper);
      if (artwork.ugoira) await this.player.load(artwork.ugoira);
    } catch (error) {
      console.error("Artwork refresh failed", error);
      this.view.setFailure(true);
    } finally {
      const initialLoadStillBlank = this.view.container?.classList.contains("notReady") || false;
      this.view.setLoading(false, { keepSpinner: initialLoadStillBlank });
      this.requesting = false;
    }
  }
}
