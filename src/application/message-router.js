import { MessageType } from "../domain/messages.js";

export class MessageRouter {
  constructor({ browserAPI, pool, auth, client, connectivity, requestArtwork = (options) => pool.take(options) }) {
    this.browserAPI = browserAPI;
    this.pool = pool;
    this.auth = auth;
    this.client = client;
    this.connectivity = connectivity;
    this.requestArtwork = requestArtwork;
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
        const artwork = await this.requestArtwork({ advance: message.advance === true });
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

}
