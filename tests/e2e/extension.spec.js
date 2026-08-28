import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium, expect, test } from "@playwright/test";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const extensionPath = path.join(root, "dist", "chrome");

test.describe("packaged PixTab", () => {
  let context;
  let extensionId;
  let runtimeErrors;

  test.beforeAll(async () => {
    context = await chromium.launchPersistentContext("", {
      headless: true,
      channel: "chromium",
      args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`]
    });
    runtimeErrors = [];
    context.on("weberror", (webError) => runtimeErrors.push(webError.error().message));
    let worker = context.serviceWorkers()[0];
    if (!worker) worker = await context.waitForEvent("serviceworker");
    worker.on("console", (message) => {
      if (message.type() === "error") runtimeErrors.push(message.text());
    });
    extensionId = new URL(worker.url()).host;
  });

  test.afterAll(async () => context?.close());

  test("loads the options controller and preserves the current layout", async ({}, testInfo) => {
    const initialRuntimeErrorCount = runtimeErrors.length;
    const page = await context.newPage();
    const pageErrors = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));
    await page.goto(`chrome-extension://${extensionId}/src/options/options.html`);
    await expect(page.locator("#order")).toBeVisible();
    await expect(page.locator("#themeAutoBtn")).toBeVisible();
    await expect(page.locator("#settingsHeading")).toHaveText("Settings");
    await expect(page.locator("#orderLabel")).toHaveText("Update Mode");
    await expect(page.locator("#dailyRankingOrder")).toHaveText("Daily Ranking");
    await expect(page.locator("#reset")).toHaveText("Reset to default settings");
    await page.screenshot({
      path: testInfo.outputPath("options.png"),
      fullPage: true,
      animations: "disabled"
    });
    await page.locator("#blt").fill("123");
    await page.waitForTimeout(650);
    const storedMinimum = await page.evaluate(async () => (await chrome.storage.local.get("blt")).blt);
    expect(storedMinimum).toBe(123);
    await page.locator("#languageSelect").selectOption("zh-CN");
    await expect(page.locator("#settingsHeading")).toHaveText("设置");
    await expect(page.locator("#orderLabel")).toHaveText("更新模式");
    expect(await page.evaluate(() => localStorage.getItem("language"))).toBe("zh-CN");
    await page.locator("#themeLightBtn").click();
    await expect(page.locator("body")).toHaveAttribute("data-theme", "light");
    expect(await page.evaluate(() => localStorage.getItem("themePreference"))).toBe("light");
    await page.locator("#reset").click();
    await expect(page.locator("#blt")).toHaveValue("");
    await expect.poll(() => page.evaluate(async () => (await chrome.storage.local.get("blt")).blt)).toBeNull();
    await page.waitForTimeout(250);
    const networkRules = await page.evaluate(async () => chrome.declarativeNetRequest.getDynamicRules());
    expect(networkRules.map((rule) => rule.id).sort()).toEqual([1, 2, 3, 4, 5]);
    expect(networkRules.find((rule) => rule.id === 2)?.action.requestHeaders).toContainEqual({
      header: "referer",
      operation: "set",
      value: "https://www.pixiv.net/"
    });
    const routed = await page.evaluate(async () => {
      try {
        await chrome.runtime.sendMessage({ action: "e2e.ping" });
        return true;
      } catch {
        return false;
      }
    });
    expect(routed).toBe(true);
    expect(pageErrors).toEqual([]);
    expect(runtimeErrors.slice(initialRuntimeErrorCount)).toEqual([]);
    await page.close();
  });

  test("loads the new-tab controller and settings overlay", async ({}, testInfo) => {
    const page = await context.newPage();
    const pageErrors = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));
    await page.goto(`chrome-extension://${extensionId}/src/newtab/index.html`);
    await expect(page.locator(".pix-spinner")).toHaveCSS("box-shadow", "none");
    await expect(page.locator(".pix-spinner")).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
    await page.locator("#container").evaluate((element) => element.classList.remove("notReady"));
    await expect(page.locator("#settingsButton")).toBeVisible();
    await page.locator("#settingsButton").click();
    await expect(page.locator("#settingsOverlay")).toHaveClass(/visible/);
    await expect(page.locator("#container")).toHaveJSProperty("inert", true);
    await expect(page.locator("#settingsCloseButton")).toBeFocused();
    await page.addStyleTag({ content: "*,*::before,*::after{animation:none!important;transition:none!important}" });
    await page.screenshot({
      path: testInfo.outputPath("newtab-settings.png"),
      fullPage: true,
      animations: "disabled"
    });
    await page.locator("#settingsCloseButton").click();
    await expect(page.locator("#settingsOverlay")).not.toHaveClass(/visible/);
    await expect(page.locator("#container")).toHaveJSProperty("inert", false);
    await expect(page.locator("#settingsButton")).toBeFocused();
    expect(pageErrors).toEqual([]);
    await page.close();
  });
});
