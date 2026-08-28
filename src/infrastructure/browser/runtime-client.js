import browserAPI from "../../shared/browser-polyfill.js";

const delay = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

export class RuntimeClient {
  constructor(api = browserAPI) {
    this.api = api;
  }

  async send(message, { timeout = 10_000, retries = 2 } = {}) {
    for (let attempt = 0; attempt <= retries; attempt += 1) {
      try {
        let timer;
        try {
          return await Promise.race([
            Promise.resolve(this.api.runtime.sendMessage(message)),
            new Promise((_, reject) => {
              timer = setTimeout(() => reject(new Error("MESSAGE_TIMEOUT")), timeout);
            })
          ]);
        } finally {
          clearTimeout(timer);
        }
      } catch (error) {
        if (attempt === retries) return null;
        await delay((attempt + 1) * 400);
      }
    }
    return null;
  }
}
