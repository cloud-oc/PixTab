import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const extensionPath = path.join(root, "dist", "chrome");
const context = await chromium.launchPersistentContext("", {
  headless: true,
  channel: "chromium",
  args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`]
});

const report = {
  pageErrors: [],
  workerConsole: [],
  network: [],
  failedRequests: []
};

try {
  context.on("response", (response) => {
    if (/pixiv\.net|pximg\.net/.test(response.url())) {
      report.network.push({ status: response.status(), url: response.url() });
    }
  });
  context.on("requestfailed", (request) => {
    if (/pixiv\.net|pximg\.net/.test(request.url())) {
      report.failedRequests.push({ error: request.failure()?.errorText, url: request.url() });
    }
  });

  let worker = context.serviceWorkers()[0];
  if (!worker) worker = await context.waitForEvent("serviceworker");
  worker.on("console", (message) => report.workerConsole.push({ type: message.type(), text: message.text() }));
  const extensionId = new URL(worker.url()).host;

  const setup = await context.newPage();
  await setup.goto(`chrome-extension://${extensionId}/src/options/options.html`);
  await setup.evaluate(async () => {
    await chrome.storage.local.set({
      debugLogging: true,
      order: "ranking_daily",
      mode: "safe",
      type: "illust_and_ugoira",
      blt: null,
      bgt: null,
      minWidthPx: null,
      minHeightPx: null,
      reverseProxyDomain: ""
    });
  });
  report.rules = await setup.evaluate(async () => chrome.declarativeNetRequest.getDynamicRules());
  await setup.waitForTimeout(500);
  await setup.close();

  const page = await context.newPage();
  page.on("pageerror", (error) => report.pageErrors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") report.pageErrors.push(message.text());
  });
  const startedAt = Date.now();
  await page.goto(`chrome-extension://${extensionId}/src/newtab/index.html`);
  try {
    await page.waitForFunction(() => !document.querySelector("#container")?.classList.contains("notReady"), null, {
      timeout: 60_000
    });
    report.loaded = true;
  } catch {
    report.loaded = false;
  }
  report.elapsedMs = Date.now() - startedAt;
  report.pageState = await page.evaluate(() => ({
    classes: document.querySelector("#container")?.className,
    spinnerClasses: document.querySelector("#loadingSpinner")?.className,
    title: document.querySelector("#illustTitle a")?.textContent,
    foreground: document.querySelector("#foregroundImage")?.style.backgroundImage.slice(0, 80),
    refreshBusy: document.querySelector("#refreshButton")?.getAttribute("aria-busy")
  }));
  console.log(JSON.stringify(report, null, 2));
  process.exitCode = report.loaded ? 0 : 1;
} finally {
  await context.close();
}
