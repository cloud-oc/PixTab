import browserAPI from "../../shared/browser-api.js";

export class PixivAuthService {
  constructor(client) {
    this.client = client;
  }

  async status() {
    try {
      const request = { url: "https://www.pixiv.net", name: "PHPSESSID" };
      const cookie = await browserAPI.cookies.get(request);
      const userId = /^\d+$/.test(cookie?.value?.split("_")[0] || "") ? cookie.value.split("_")[0] : null;
      if (!userId) return { loggedIn: false };
      const profile = await this.client.json(`/ajax/user/${userId}?full=0`);
      if (!profile?.body?.name) return { loggedIn: false };
      return { loggedIn: true, userId, userName: profile.body.name };
    } catch {
      return { loggedIn: false };
    }
  }
}
