import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const extensionPath = path.join(root, "dist", "chrome");
const context = await chromium.launchPersistentContext("", {
  headless: true, channel: "chromium",
  args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`]
});
const report = { console: [], zipRequests: [] };

async function waitForPlayback(page) {
  await page.waitForFunction(() => {
    const canvas = document.getElementById("ugoiraCanvas");
    return canvas && getComputedStyle(canvas).display === "block"
      && !document.getElementById("playPauseButton")?.classList.contains("hidden");
  }, null, { timeout: 90_000 });
  return page.evaluate(async () => {
    const canvas = document.getElementById("ugoiraCanvas");
    const first = canvas.toDataURL();
    await new Promise((resolve) => setTimeout(resolve, 1500));
    const second = canvas.toDataURL();
    return {
      artwork: document.querySelector("#illustTitle a")?.href,
      changed: first !== second,
      failed: document.getElementById("container")?.classList.contains("load-failed"),
      cacheBytes: sessionStorage.getItem("pixtab.currentArtwork")?.length || 0
    };
  });
}

try {
  let worker = context.serviceWorkers()[0];
  if (!worker) worker = await context.waitForEvent("serviceworker");
  const extensionId = new URL(worker.url()).host;
  const setup = await context.newPage();
  await setup.goto(`chrome-extension://${extensionId}/src/options/options.html`);
  await setup.evaluate(async () => chrome.storage.local.set({
    order: "ranking_daily", mode: "safe", type: "ugoira", aiType: "display",
    blt: null, bgt: null, minWidthPx: null, minHeightPx: null, reverseProxyDomain: ""
  }));
  await setup.close();

  const page = await context.newPage();
  page.on("console", (message) => {
    if (["warning", "error"].includes(message.type())) report.console.push(message.text());
  });
  context.on("request", (request) => {
    if (request.url().includes("img-zip-ugoira")) report.zipRequests.push(request.url());
  });
  await page.goto(`chrome-extension://${extensionId}/src/newtab/index.html`);
  report.initial = await waitForPlayback(page);
  await page.reload();
  report.reloaded = await waitForPlayback(page);
  await page.locator("#refreshButton").click();
  await page.waitForFunction((previous) => document.querySelector("#illustTitle a")?.href !== previous, report.reloaded.artwork, { timeout: 90_000 });
  report.advanced = await waitForPlayback(page);
  console.log(JSON.stringify(report, null, 2));
  process.exitCode = report.initial.changed && report.reloaded.changed && report.advanced.changed
    && report.initial.artwork === report.reloaded.artwork
    && report.advanced.artwork !== report.reloaded.artwork
    && !report.console.length ? 0 : 1;
} finally {
  await context.close();
}
