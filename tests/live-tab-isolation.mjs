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

const artworkId = (page) => page.locator("#illustTitle a").getAttribute("href");
const waitUntilReady = (page) => page.waitForFunction(() => (
  !document.getElementById("container")?.classList.contains("notReady")
));

try {
  let worker = context.serviceWorkers()[0];
  if (!worker) worker = await context.waitForEvent("serviceworker");
  const extensionId = new URL(worker.url()).host;
  const url = `chrome-extension://${extensionId}/src/newtab/index.html`;
  const setup = await context.newPage();
  await setup.goto(`chrome-extension://${extensionId}/src/options/options.html`);
  await setup.evaluate(async () => chrome.storage.local.set({
    order: "ranking_daily", mode: "safe", type: "illust", aiType: "display",
    blt: null, bgt: null, minWidthPx: null, minHeightPx: null, reverseProxyDomain: ""
  }));
  await setup.waitForTimeout(300);
  await setup.close();

  const first = await context.newPage();
  await first.goto(url);
  await waitUntilReady(first);
  const initial = await artworkId(first);
  await first.addInitScript(() => {
    window.__pixtabLoadingFrames = [];
    const sample = () => {
      const spinner = document.getElementById("loadingSpinner");
      if (spinner) {
        const style = getComputedStyle(spinner);
        window.__pixtabLoadingFrames.push(style.display !== "none" && style.visibility !== "hidden");
      }
      if (window.__pixtabLoadingFrames.length < 10) requestAnimationFrame(sample);
    };
    requestAnimationFrame(sample);
  });
  await first.reload();
  await waitUntilReady(first);
  await first.waitForTimeout(180);
  const afterReload = await artworkId(first);
  const reloadShowedLoading = await first.evaluate(() => window.__pixtabLoadingFrames.some(Boolean));

  const second = await context.newPage();
  await second.goto(url);
  await waitUntilReady(second);
  const secondInitial = await artworkId(second);

  await first.locator("#refreshButton").click();
  await first.waitForFunction((previous) => document.querySelector("#illustTitle a")?.href !== previous, initial);
  const firstAdvanced = await artworkId(first);
  const secondAfterAdvance = await artworkId(second);
  const report = { initial, afterReload, reloadShowedLoading, secondInitial, firstAdvanced, secondAfterAdvance };
  console.log(JSON.stringify(report, null, 2));
  process.exitCode = initial === afterReload
    && initial === secondInitial
    && !reloadShowedLoading
    && firstAdvanced !== initial
    && secondAfterAdvance === secondInitial
    ? 0
    : 1;
} finally {
  await context.close();
}
