const THEME_CHECK_INTERVAL_MS = 5 * 60 * 1000;

export function initThemeSync(doc = document) {
    const applyTimeBasedTheme = () => {
        const hour = new Date().getHours();
        const nextTheme = hour >= 7 && hour < 19 ? "light" : "dark";
        if (doc.body?.dataset?.theme !== nextTheme) {
            doc.body.dataset.theme = nextTheme;
        }
    };

    applyTimeBasedTheme();
    const timerId = setInterval(applyTimeBasedTheme, THEME_CHECK_INTERVAL_MS);
    const visibilityHandler = () => {
        if (!doc.hidden) {
            applyTimeBasedTheme();
        }
    };
    doc.addEventListener("visibilitychange", visibilityHandler);

    return () => {
        clearInterval(timerId);
        doc.removeEventListener("visibilitychange", visibilityHandler);
    };
}
