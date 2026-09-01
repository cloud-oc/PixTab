import { readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium, expect, test } from "@playwright/test";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const extensionPath = path.join(root, "dist", "chrome");
const ugoiraChunk = readdirSync(path.join(extensionPath, "src", "entrypoints", "chunks"))
  .find((file) => file.startsWith("ugoira-player-") && file.endsWith(".js"));

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
    await expect(page.locator("#orderCustomButton")).toBeVisible();
    await expect(page.locator("#themeAutoBtn")).toBeVisible();
    const themeButtons = await page.locator(".theme-switcher button").evaluateAll((buttons) => buttons.map((button) => {
      const box = button.getBoundingClientRect();
      return { x: box.x, y: box.y };
    }));
    expect(themeButtons.every(({ x }) => x === themeButtons[0].x)).toBe(true);
    expect(themeButtons[0].x).toBeGreaterThan(720);
    expect(themeButtons[0].y).toBeLessThan(themeButtons[1].y);
    expect(themeButtons[1].y).toBeLessThan(themeButtons[2].y);
    await expect(page.locator("#settingsHeading")).toHaveText("Settings");
    await expect(page.locator("#orderLabel")).toHaveText("Update Mode");
    await expect(page.locator("#dailyRankingOrder")).toHaveText("Daily Ranking");
    await expect(page.locator("#reset")).toHaveText("Reset to default settings");
    await page.locator("#orderCustomButton").click();
    await expect(page.locator("#orderCustomList")).toBeVisible();
    await expect(page.locator("#orderCustomList")).toHaveCSS("border-radius", "13px");
    await page.locator('#orderCustomList [data-value="artist"]').click();
    await expect(page.locator("#order")).toHaveValue("artist");
    await expect(page.locator("#orderCustomButton .custom-select__value")).toHaveText("Specific Artist");
    await page.evaluate(() => window.scrollTo({ top: 500, behavior: "instant" }));
    await expect(page.locator("html")).toHaveClass(/is-scrolling/);
    await page.waitForTimeout(750);
    await expect(page.locator("html")).not.toHaveClass(/is-scrolling/);
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
    const startupResources = await page.evaluate(() => performance.getEntriesByType("resource").map(({ name }) => name));
    expect(startupResources.some((url) => url.includes("/chunks/"))).toBe(false);
    expect(ugoiraChunk).toBeTruthy();
    const chunkExportsPlayer = await page.evaluate(async (url) => {
      const module = await import(url);
      return typeof module.UgoiraPlayer === "function";
    }, `chrome-extension://${extensionId}/src/entrypoints/chunks/${ugoiraChunk}`);
    expect(chunkExportsPlayer).toBe(true);
    await expect(page.locator(".pix-spinner")).toHaveCSS("box-shadow", "none");
    await expect(page.locator(".pix-spinner")).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
    await page.locator("#container").evaluate((element) => element.classList.remove("notReady"));
    await page.locator("#illustInfo").evaluate((element) => { element.className = "unfocused"; });
    await page.locator("#illustInfo").hover();
    await expect(page.locator("#illustInfo")).toHaveClass(/focused/);
    const saveTarget = await page.evaluate(() => {
      const element = document.elementFromPoint(innerWidth / 2, innerHeight / 2);
      return { id: element?.id, tagName: element?.tagName };
    });
    expect(saveTarget).toEqual({ id: "saveableArtwork", tagName: "IMG" });
    await expect(page.locator("#settingsButton")).toBeVisible();
    await expect(page.locator("#refreshButton .icon")).toHaveCSS("width", "19px");
    await expect(page.locator("#refreshButton .icon")).toHaveCSS("height", "19px");
    expect(await page.locator("#refreshButton .icon").getAttribute("style")).toBeNull();
    const [compactCardBox, compactToggleBox] = await Promise.all([
      page.locator("#illustInfo").boundingBox(),
      page.locator("#settingsButton").boundingBox()
    ]);
    await page.locator("#settingsButton").click();
    await expect(page.locator("#settingsOverlay")).toHaveClass(/visible/);
    await expect(page.locator("#illustInfo")).toHaveClass(/settings-expanded/);
    await expect(page.locator("#settingsButton")).toHaveAttribute("aria-expanded", "true");
    await expect(page.locator("#settingsButton")).toHaveAttribute("aria-label", "Close settings");
    await expect(page.locator("#settingsButton")).toBeFocused();
    await page.mouse.move(0, 0);
    await page.waitForTimeout(100);
    const motionToggleBox = await page.locator("#settingsButton").boundingBox();
    expect(Math.abs((motionToggleBox.x + motionToggleBox.width / 2) - (compactToggleBox.x + compactToggleBox.width / 2))).toBeLessThanOrEqual(0.75);
    expect(Math.abs((motionToggleBox.y + motionToggleBox.height / 2) - (compactToggleBox.y + compactToggleBox.height / 2))).toBeLessThanOrEqual(0.75);
    expect(Math.abs(motionToggleBox.width - compactToggleBox.width)).toBeLessThanOrEqual(0.75);
    expect(Math.abs(motionToggleBox.height - compactToggleBox.height)).toBeLessThanOrEqual(0.75);
    await page.waitForTimeout(350);
    await expect(page.locator("#artworkInfoView")).toHaveCSS("visibility", "hidden");
    await expect(page.locator("#artworkInfoView")).toHaveCSS("opacity", "0");
    const [expandedCardBox, toggleBox, themeBox] = await Promise.all([
      page.locator("#illustInfo").boundingBox(),
      page.locator("#settingsButton").boundingBox(),
      page.locator("#overlayThemeSwitcher").boundingBox()
    ]);
    expect(expandedCardBox.width).toBeGreaterThan(compactCardBox.width);
    expect(expandedCardBox.height).toBeGreaterThan(compactCardBox.height);
    expect(expandedCardBox.x).toBeLessThan(compactCardBox.x);
    expect(expandedCardBox.y).toBeLessThan(compactCardBox.y);
    expect(Math.abs((expandedCardBox.x + expandedCardBox.width) - (compactCardBox.x + compactCardBox.width))).toBeLessThanOrEqual(0.5);
    expect(Math.abs((expandedCardBox.y + expandedCardBox.height) - (compactCardBox.y + compactCardBox.height))).toBeLessThanOrEqual(0.5);
    expect(Math.abs((toggleBox.x + toggleBox.width / 2) - (compactToggleBox.x + compactToggleBox.width / 2))).toBeLessThanOrEqual(0.5);
    expect(Math.abs((toggleBox.y + toggleBox.height / 2) - (compactToggleBox.y + compactToggleBox.height / 2))).toBeLessThanOrEqual(0.5);
    expect(toggleBox.width).toBe(compactToggleBox.width);
    expect(toggleBox.height).toBe(compactToggleBox.height);
    expect(themeBox).not.toBeNull();
    expect(themeBox.x + themeBox.width).toBeLessThan(expandedCardBox.x + expandedCardBox.width);
    expect(themeBox.y).toBeLessThan(toggleBox.y);
    const originalViewport = page.viewportSize();
    await page.setViewportSize({ width: 900, height: 600 });
    await expect.poll(async () => {
      const box = await page.locator("#illustInfo").boundingBox();
      return { width: box.width, height: box.height, right: box.x + box.width, bottom: box.y + box.height };
    }).toEqual({ width: 852, height: 552, right: 876, bottom: 576 });
    await expect(page.locator("#artworkInfoView")).toHaveCSS("visibility", "hidden");
    await page.setViewportSize(originalViewport);
    await expect.poll(async () => (await page.locator("#illustInfo").boundingBox()).width).toBe(960);
    await page.locator('#overlayThemeSwitcher [data-theme-value="dark"]').click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await expect(page.locator("body")).toHaveAttribute("data-theme", "dark");
    await expect(page.frameLocator("#settingsFrame").locator("html")).toHaveAttribute("data-theme", "dark");
    await expect(page.frameLocator("#settingsFrame").locator("body")).toHaveAttribute("data-theme", "dark");
    await expect(page.frameLocator("#settingsFrame").locator("html")).toHaveCSS("color-scheme", "dark");
    await expect(page.frameLocator("#settingsFrame").locator("body")).toHaveCSS("color-scheme", "dark");
    await page.locator('#overlayThemeSwitcher [data-theme-value="light"]').click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    await expect(page.frameLocator("#settingsFrame").locator("html")).toHaveAttribute("data-theme", "light");
    await expect(page.frameLocator("#settingsFrame").locator("html")).toHaveCSS("color-scheme", "light");
    await expect(page.frameLocator("#settingsFrame").locator("body")).toHaveCSS("color-scheme", "light");
    await page.locator('#overlayThemeSwitcher [data-theme-value="auto"]').click();
    await page.emulateMedia({ colorScheme: "dark" });
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await expect(page.frameLocator("#settingsFrame").locator("html")).toHaveCSS("color-scheme", "dark");
    await page.emulateMedia({ colorScheme: "light" });
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    await expect(page.frameLocator("#settingsFrame").locator("html")).toHaveCSS("color-scheme", "light");
    await page.locator('#overlayThemeSwitcher [data-theme-value="dark"]').click();
    await page.addStyleTag({ content: "*,*::before,*::after{animation:none!important;transition:none!important}" });
    await page.screenshot({
      path: testInfo.outputPath("newtab-settings.png"),
      fullPage: true,
      animations: "disabled"
    });
    await page.locator("#settingsButton").click();
    await expect(page.locator("#settingsOverlay")).not.toHaveClass(/visible/);
    await expect(page.locator("#illustInfo")).not.toHaveClass(/settings-expanded/);
    await expect(page.locator("#artworkInfoView")).toHaveCSS("visibility", "visible");
    await expect(page.locator("#settingsButton")).toHaveAttribute("aria-expanded", "false");
    await expect(page.locator("#settingsButton")).toBeFocused();

    await page.locator("#settingsButton").dispatchEvent("click");
    await page.waitForTimeout(70);
    await page.locator("#settingsButton").dispatchEvent("click");
    await page.waitForTimeout(45);
    await page.locator("#settingsButton").dispatchEvent("click");
    await expect(page.locator("#illustInfo")).toHaveClass(/settings-expanded/);
    await expect(page.locator("#settingsButton")).toHaveAttribute("aria-expanded", "true");
    await page.keyboard.press("Escape");
    await expect(page.locator("#illustInfo")).not.toHaveClass(/settings-expanded/);

    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.locator("#settingsButton").click();
    await expect(page.locator("#illustInfo")).toHaveClass(/settings-expanded/);
    await page.locator("#settingsOverlay").click({ position: { x: 8, y: 8 } });
    await expect(page.locator("#illustInfo")).not.toHaveClass(/settings-expanded/);
    await expect(page.locator("#settingsOverlay")).not.toHaveClass(/visible/);
    expect(pageErrors).toEqual([]);
    await page.close();
  });
});
