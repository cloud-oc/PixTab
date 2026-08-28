import { access, readFile } from "node:fs/promises";
import path from "node:path";

const root = path.resolve("dist", "firefox");
const manifest = JSON.parse(await readFile(path.join(root, "manifest.json"), "utf8"));
const errors = [];

if (manifest.manifest_version !== 3) errors.push("manifest_version must be 3");
if (manifest.background?.service_worker) errors.push("Firefox package must not retain background.service_worker");
if (!Array.isArray(manifest.background?.scripts) || manifest.background.scripts.length !== 1) {
  errors.push("Firefox package must contain one background script");
}
if (manifest.background?.type !== "module") errors.push("Firefox background must remain an ES module");
if (!manifest.browser_specific_settings?.gecko?.id) errors.push("Firefox extension id is missing");
if (manifest.browser_specific_settings?.gecko?.strict_min_version !== "140.0") {
  errors.push("Firefox strict_min_version must remain 140.0");
}

const referencedFiles = [
  ...(manifest.background?.scripts || []),
  manifest.chrome_url_overrides?.newtab,
  manifest.options_page,
  ...Object.values(manifest.icons || {}),
  manifest.action?.default_icon,
  `_locales/${manifest.default_locale}/messages.json`,
  "LICENSE",
  "THIRD_PARTY_NOTICES"
].filter((value) => typeof value === "string");

for (const relative of referencedFiles) {
  try {
    await access(path.join(root, relative));
  } catch {
    errors.push(`Referenced file is missing: ${relative}`);
  }
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exitCode = 1;
} else {
  console.log(`Firefox manifest valid; checked ${referencedFiles.length} packaged references.`);
}
