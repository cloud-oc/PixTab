import { initThemeSync } from "../shared/theme.js";
import { NewTabController } from "../ui/newtab/newtab-controller.js";
import { createPromoRuntime } from "../ui/newtab/promo-runtime.js";

initThemeSync();

const start = () => new NewTabController(
  new URLSearchParams(location.search).get("promo") === "1"
    ? { runtime: createPromoRuntime() }
    : undefined
).initialize().catch((error) => {
  console.error("New-tab initialization failed", error);
});

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
else void start();
