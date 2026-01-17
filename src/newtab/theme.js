export function initThemeSync(doc = document) {
    const darkModeMediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const applySystemTheme = () => {
        const nextTheme = darkModeMediaQuery.matches ? "dark" : "light";
        if (doc.body?.dataset?.theme !== nextTheme) {
            doc.body.dataset.theme = nextTheme;
        }
    };

    applySystemTheme();

    // Listen for system theme changes
    const mediaChangeHandler = () => {
        applySystemTheme();
    };
    darkModeMediaQuery.addEventListener("change", mediaChangeHandler);

    const visibilityHandler = () => {
        if (!doc.hidden) {
            applySystemTheme();
        }
    };
    doc.addEventListener("visibilitychange", visibilityHandler);

    return () => {
        darkModeMediaQuery.removeEventListener("change", mediaChangeHandler);
        doc.removeEventListener("visibilitychange", visibilityHandler);
    };
}
