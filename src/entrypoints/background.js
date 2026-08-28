import browserAPI from "../shared/browser-polyfill.js";
import { BackgroundApplication } from "../application/background-application.js";
import { installNetworkRules } from "../infrastructure/browser/net-rules.js";

self.addEventListener("error", (event) => {
  console.error("Uncaught service-worker error", event.error);
  event.preventDefault();
});
self.addEventListener("unhandledrejection", (event) => {
  console.error("Unhandled service-worker rejection", event.reason);
  event.preventDefault();
});

const application = new BackgroundApplication(browserAPI);
const networkReady = installNetworkRules(browserAPI).catch((error) => {
  console.error("Network rule installation failed", error);
});
const ready = networkReady.then(() => application.start());
application.installMessageListener(ready);

browserAPI.storage.onChanged.addListener((changes, area) => {
  if (area === "local") void application.reload();
});
