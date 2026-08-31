(() => {
  try {
    if (sessionStorage.getItem("pixtab.currentArtwork")) {
      document.documentElement.classList.add("has-tab-artwork");
    }
  } catch {
    // The controller will use the normal loading state when session storage is unavailable.
  }
})();
