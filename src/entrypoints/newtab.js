import { initThemeSync } from "../shared/theme.js";
import { NewTabController } from "../ui/newtab/newtab-controller.js";

initThemeSync();

const start = () => new NewTabController().initialize().catch((error) => {
  console.error("New-tab initialization failed", error);
});

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
else void start();
