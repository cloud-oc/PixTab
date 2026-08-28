import { initThemeSync } from "../shared/theme.js";
import { OptionsController } from "../ui/options/options-controller.js";

if (new URLSearchParams(location.search).has("embedded")) {
  document.documentElement.dataset.embedded = "true";
  document.body.dataset.embedded = "true";
}
initThemeSync();

const start = () => new OptionsController().initialize().catch((error) => {
  console.error("Options initialization failed", error);
});

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
else void start();
