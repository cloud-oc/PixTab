import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const output = path.join(root, ".impeccable", "review");
const extensionPath = path.join(root, "dist", "chrome");
await mkdir(output, { recursive: true });

const context = await chromium.launchPersistentContext("", {
  headless: true,
  channel: "chromium",
  viewport: { width: 1440, height: 900 },
  args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`]
});

try {
  let worker = context.serviceWorkers()[0];
  if (!worker) worker = await context.waitForEvent("serviceworker");
  const extensionId = new URL(worker.url()).host;
  const errors = [];
  context.on("weberror", (event) => errors.push(event.error().message));

  const options = await context.newPage();
  await options.goto(`chrome-extension://${extensionId}/src/options/options.html`);
  await options.locator("#settingsHeading").waitFor();
  await options.screenshot({ path: path.join(output, "desktop-options.png"), fullPage: true, animations: "disabled" });
  await options.locator("#orderCustomButton").click();
  await options.screenshot({ path: path.join(output, "desktop-options-dropdown.png"), fullPage: true, animations: "disabled" });
  await options.keyboard.press("Escape");
  await options.setViewportSize({ width: 390, height: 844 });
  await options.screenshot({ path: path.join(output, "mobile-options.png"), fullPage: true, animations: "disabled" });
  await options.locator("#languageSelectCustomButton").click();
  await options.screenshot({ path: path.join(output, "mobile-options-dropdown.png"), fullPage: true, animations: "disabled" });
  await options.keyboard.press("Escape");
  const optionsOverflow = await options.evaluate(() => {
    if (document.documentElement.scrollWidth <= innerWidth) return [];
    return [...document.querySelectorAll("body *")].flatMap((element) => {
      const box = element.getBoundingClientRect();
      return box.right > innerWidth + 0.5 || box.left < -0.5
        ? [{ element: element.id || element.className || element.tagName, left: box.left, right: box.right, width: box.width }]
        : [];
    }).slice(0, 12);
  });
  if (optionsOverflow.length) throw new Error(`Options page overflows horizontally at 390px: ${JSON.stringify(optionsOverflow)}`);

  const newtab = await context.newPage();
  await newtab.setViewportSize({ width: 1440, height: 900 });
  await newtab.goto(`chrome-extension://${extensionId}/src/newtab/index.html`);
  await newtab.locator("#container:not(.notReady)").waitFor({ timeout: 30_000 });
  await newtab.locator("#illustInfo").evaluate((element) => {
    element.className = "focused";
  });
  await newtab.screenshot({ path: path.join(output, "desktop-newtab.png"), animations: "disabled" });
  await newtab.locator("#settingsButton").click();
  await newtab.locator("#settingsOverlay.visible").waitFor();
  await newtab.screenshot({ path: path.join(output, "desktop-overlay.png"), animations: "disabled" });
  await newtab.locator("#settingsButton").click();

  await newtab.setViewportSize({ width: 390, height: 844 });
  await newtab.locator("#illustInfo").evaluate((element) => {
    element.className = "focused";
  });
  const mobileCardState = await newtab.locator("#illustInfo").evaluate((element) => {
    const avatar = element.querySelector("#avatar");
    const description = element.querySelector("#description");
    const title = element.querySelector("#illustTitle a");
    const rect = (node) => {
      const box = node?.getBoundingClientRect();
      return box ? { width: box.width, height: box.height } : null;
    };
    return {
      title: title?.textContent?.trim() || "",
      avatar: rect(avatar),
      description: rect(description),
      containerInert: document.getElementById("container")?.inert,
      avatarVisibility: avatar ? getComputedStyle(avatar).visibility : null,
      descriptionColor: description ? getComputedStyle(description).color : null,
      descriptionOpacity: description ? getComputedStyle(description).opacity : null
    };
  });
  if (!mobileCardState.title || !mobileCardState.avatar?.width || !mobileCardState.description?.width) {
    throw new Error(`Mobile artwork card lost its content: ${JSON.stringify(mobileCardState)}`);
  }
  await newtab.screenshot({ path: path.join(output, "mobile-newtab.png"), animations: "disabled" });
  await newtab.locator("#settingsButton").click();
  await newtab.locator("#settingsOverlay.visible").waitFor();
  await newtab.screenshot({ path: path.join(output, "mobile-overlay.png"), animations: "disabled" });
  const overlayFits = await newtab.locator("#illustInfo.settings-expanded").evaluate((element) => {
    const box = element.getBoundingClientRect();
    return box.left >= 0 && box.right <= innerWidth && box.top >= 0 && box.bottom <= innerHeight;
  });
  if (!overlayFits) throw new Error("Settings overlay does not fit the mobile viewport");
  if (errors.length) throw new Error(`Browser errors: ${errors.join("; ")}`);
} finally {
  await context.close();
}

console.log(`Captured Liquid Glass review images in ${path.relative(root, output)}`);
