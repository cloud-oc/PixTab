import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const extensionPath = path.join(root, "dist", "chrome");
const reverseProxyDomain = process.env.PIXTAB_LIVE_PROXY_DOMAIN || "";
const context = await chromium.launchPersistentContext("", {
  headless: true,
  channel: "chromium",
  args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`]
});
const report = { pageErrors: [], workerErrors: [], network: [] };

try {
  context.on("response", (response) => {
    if (/ugoira|pximg\.net/.test(response.url())) {
      report.network.push({ status: response.status(), url: response.url() });
    }
  });
  let worker = context.serviceWorkers()[0];
  if (!worker) worker = await context.waitForEvent("serviceworker");
  worker.on("console", (message) => {
    if (["error", "warning"].includes(message.type())) report.workerErrors.push(message.text());
  });
  const extensionId = new URL(worker.url()).host;
  const setup = await context.newPage();
  await setup.goto(`chrome-extension://${extensionId}/src/options/options.html`);
  await setup.evaluate(async (proxyDomain) => chrome.storage.local.set({
    order: "ranking_daily",
    mode: "safe",
    type: "ugoira",
    aiType: "display",
    blt: null,
    bgt: null,
    minWidthPx: null,
    minHeightPx: null,
    reverseProxyDomain: proxyDomain
  }), reverseProxyDomain);
  await setup.waitForTimeout(500);
  await setup.close();
  const page = await context.newPage();
  page.on("pageerror", (error) => report.pageErrors.push(error.message));
  await page.goto(`chrome-extension://${extensionId}/src/newtab/index.html`);
  await Promise.race([
    page.waitForSelector("#ugoiraCanvas", { state: "attached", timeout: 60_000 }),
    page.waitForSelector("#container.load-failed", { state: "attached", timeout: 60_000 })
  ]).catch(() => undefined);
  report.automaticMode = await page.evaluate(async () => {
    await new Promise((resolve) => setTimeout(resolve, 600));
    const canvas = document.getElementById("ugoiraCanvas");
    const first = canvas?.toDataURL();
    await new Promise((resolve) => setTimeout(resolve, 1200));
    const second = canvas?.toDataURL();
    const button = document.getElementById("playPauseButton");
    button?.click();
    const pausedFirst = canvas?.toDataURL();
    await new Promise((resolve) => setTimeout(resolve, 1200));
    const pausedSecond = canvas?.toDataURL();
    button?.click();
    await new Promise((resolve) => setTimeout(resolve, 1200));
    const resumed = canvas?.toDataURL();
    return {
      cardTitle: document.querySelector("#illustTitle a")?.textContent,
      canvasPresent: Boolean(canvas),
      canvasParent: canvas?.parentElement?.id,
      canvasSize: canvas ? [canvas.width, canvas.height] : null,
      canvasDisplay: canvas ? getComputedStyle(canvas).display : null,
      buttonHidden: document.getElementById("playPauseButton")?.classList.contains("hidden"),
      loadFailed: document.getElementById("container")?.classList.contains("load-failed"),
      reverseProxyDomain: (await chrome.storage.local.get("reverseProxyDomain")).reverseProxyDomain || "",
      staticLayersHidden: ["backgroundImage", "foregroundImage"].every((id) => document.getElementById(id)?.classList.contains("animating")),
      framesChanged: Boolean(first && second && first !== second),
      pauseHeld: Boolean(pausedFirst && pausedFirst === pausedSecond),
      resumeChanged: Boolean(pausedSecond && resumed && pausedSecond !== resumed),
      firstBytes: first?.length || 0,
      secondBytes: second?.length || 0
    };
  });
  console.log(JSON.stringify(report, null, 2));
  process.exitCode = report.automaticMode.framesChanged
    && report.automaticMode.pauseHeld
    && report.automaticMode.resumeChanged
    && !report.pageErrors.length
    ? 0
    : 1;
} finally {
  await context.close();
}
