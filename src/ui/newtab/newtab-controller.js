import browserAPI from "../../shared/browser-polyfill.js";
import { MessageType } from "../../domain/messages.js";
import { RuntimeClient } from "../../infrastructure/browser/runtime-client.js";
import { ArtworkView } from "./artwork-view.js";
import { SettingsOverlay } from "./settings-overlay.js";
import { WallpaperRenderer } from "./wallpaper-renderer.js";

const loadUgoiraPlayer = () => import("./ugoira-player.js");

export class NewTabController {
  constructor({ doc = document, runtime = new RuntimeClient(), playerLoader = loadUgoiraPlayer } = {}) {
    this.doc = doc;
    this.runtime = runtime;
    this.view = new ArtworkView(doc);
    this.wallpaper = new WallpaperRenderer({
      background: doc.getElementById("backgroundImage"),
      foreground: doc.getElementById("foregroundImage")
    });
    this.player = null;
    this.playerTask = null;
    this.playerLoader = playerLoader;
    this.destroyed = false;
    this.overlay = new SettingsOverlay(doc);
    this.requesting = false;
  }

  initialize() {
    this.wallpaper.loadPreferences();
    this.overlay.bind();
    this.view.refreshButton?.addEventListener("click", () => void this.requestArtwork());
    browserAPI.storage.onChanged.addListener((changes, area) => {
      if (area === "local") this.wallpaper.applyChanges(changes);
    });
    browserAPI.runtime.onMessage.addListener((message) => {
      if (message?.action === "artworkLoadFailed") this.view.setFailure(true);
      if (message?.action === "artworkLoadSucceeded") this.view.setFailure(false);
    });
    window.addEventListener("pagehide", () => {
      this.destroyed = true;
      this.player?.destroy();
    }, { once: true });
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
        { timeout: 60_000, retries: 0 }
      );
      if (!artwork) {
        this.view.setFailure(true);
        if (allowAutomaticProxy) {
          const enabled = await this.runtime.send({ action: MessageType.enableProxy });
          if (enabled?.success || enabled?.reason === "already_enabled") {
            this.requesting = false;
            await new Promise((resolve) => setTimeout(resolve, 500));
            return this.requestArtwork({ allowAutomaticProxy: false });
          }
        }
        return;
      }
      this.view.setFailure(false);
      this.player?.stop();
      this.view.render(artwork, this.wallpaper);
      if (artwork.ugoira) {
        const player = await this.#getPlayer();
        if (player) await player.load(artwork.ugoira);
      }
    } catch (error) {
      console.error("Artwork refresh failed", error);
      this.view.setFailure(true);
    } finally {
      const initialLoadStillBlank = this.view.container?.classList.contains("notReady") || false;
      this.view.setLoading(false, { keepSpinner: initialLoadStillBlank });
      this.requesting = false;
    }
  }

  async #getPlayer() {
    if (this.player) return this.player;
    if (!this.playerTask) {
      this.playerTask = this.playerLoader().then(({ UgoiraPlayer }) => {
        if (this.destroyed) return null;
        const player = new UgoiraPlayer({
          doc: this.doc,
          runtime: this.runtime,
          fetchAction: MessageType.fetchUgoira
        });
        player.bind();
        this.player = player;
        return player;
      }).finally(() => {
        if (!this.player) this.playerTask = null;
      });
    }
    return this.playerTask;
  }
}
