// Shared theme management utility
// This module provides consistent theme handling across all pages

export function getThemePreference() {
  return localStorage.getItem("themePreference") || "auto";
}

export function setThemePreference(preference) {
  localStorage.setItem("themePreference", preference);
}

export function applyTheme(doc = document) {
  const preference = getThemePreference();
  const darkModeMediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  let theme;
  
  if (preference === "auto") {
    theme = darkModeMediaQuery.matches ? "dark" : "light";
  } else {
    theme = preference;
  }
  
  if (doc.body?.dataset?.theme !== theme) {
    doc.body.dataset.theme = theme;
  }
  
  return theme;
}

export function initThemeSync(doc = document) {
  const darkModeMediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  
  // Apply theme on init
  applyTheme(doc);
  
  // Listen for system theme changes (only apply when in auto mode)
  const mediaChangeHandler = () => {
    if (getThemePreference() === "auto") {
      applyTheme(doc);
    }
  };
  darkModeMediaQuery.addEventListener("change", mediaChangeHandler);
  
  // Listen for visibility changes
  const visibilityHandler = () => {
    if (!doc.hidden && getThemePreference() === "auto") {
      applyTheme(doc);
    }
  };
  doc.addEventListener("visibilitychange", visibilityHandler);
  
  // Listen for storage changes (theme preference changed in another tab/page)
  const storageHandler = (e) => {
    if (e.key === "themePreference") {
      applyTheme(doc);
    }
  };
  window.addEventListener("storage", storageHandler);
  
  // Cleanup function
  return () => {
    darkModeMediaQuery.removeEventListener("change", mediaChangeHandler);
    doc.removeEventListener("visibilitychange", visibilityHandler);
    window.removeEventListener("storage", storageHandler);
  };
}
