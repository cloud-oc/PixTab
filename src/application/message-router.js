import { MessageType } from "../domain/messages.js";

export class MessageRouter {
  constructor({ browserAPI, pool, auth, client, connectivity }) {
    this.browserAPI = browserAPI;
    this.pool = pool;
    this.auth = auth;
    this.client = client;
    this.connectivity = connectivity;
  }

  listen(ready) {
    this.browserAPI.runtime.onMessage.addListener((message, sender, sendResponse) => {
      let completed = false;
      const reply = (payload) => {
        if (completed) return;
        completed = true;
        try { sendResponse(payload); } catch { /* receiver disappeared */ }
      };
      ready.then(() => this.#dispatch(message)).then(reply).catch(() => reply(null));
      return true;
    });
  }

  async #dispatch(message = {}) {
    switch (message.action) {
      case MessageType.requestArtwork: {
        const artwork = await this.pool.take();
        void this.#notify(artwork ? "artworkLoadSucceeded" : "artworkLoadFailed");
        if (!artwork) void this.connectivity.probe({ force: true });
        return artwork;
      }
      case MessageType.checkLogin:
        return this.auth.status();
      case MessageType.enableProxy:
        return this.connectivity.enableDefaultProxy();
      default:
        return undefined;
    }
  }

  async #notify(action) {
    try {
      await this.browserAPI.runtime.sendMessage({ action });
    } catch {
      // New-tab listeners are optional.
    }
  }
}
