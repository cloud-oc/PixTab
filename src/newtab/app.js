import { initThemeSync } from "./theme.js";
import browserAPI from "../shared/browser-polyfill.js";

(function () {
  const WALLPAPER_PREF_DEFAULTS = Object.freeze({
    size: "full",
    align: "center",
    tiling: "none",
    autoCarouselIntervalMinutes: 5
  });
  let wallpaperDisplayPrefs = { ...WALLPAPER_PREF_DEFAULTS };
  let currentArtwork = null;
  let autoCarouselInterval = null;

  class WebArtworkQueue {
    constructor() {
      this.queue = [];
      this.prefetchCount = 3;
      this.isPrefetching = false;
    }

    async prefetchArtwork() {
      if (this.isPrefetching || this.queue.length >= this.prefetchCount) {
        return;
      }
      this.isPrefetching = true;
      try {
        const artwork = await fetchArtworkFallback();
        this.queue.push(artwork);
      } catch (e) {
        console.warn('Prefetch failed', e);
      } finally {
        this.isPrefetching = false;
      }
    }

    getNextArtwork() {
      if (this.queue.length > 0) {
        return this.queue.shift();
      }
      return null;
    }

    startPrefetch() {
      this.prefetchArtwork();
    }
  }

  function startAutoCarousel(intervalMinutes = 5) {
    stopAutoCarousel();
    autoCarouselInterval = setInterval(() => {
      sendRefreshMessage();
    }, intervalMinutes * 60 * 1000);
  }

  function stopAutoCarousel() {
    if (autoCarouselInterval) {
      clearInterval(autoCarouselInterval);
      autoCarouselInterval = null;
    }
  }

  const sizeValueMap = {
    original: "auto",
    full: "cover",
    best_fit: "contain"
  };
  const alignValueMap = {
    top_left: "left top",
    top: "center top",
    top_right: "right top",
    left: "left center",
    center: "center center",
    right: "right center",
    bottom_left: "left bottom",
    bottom: "center bottom",
    bottom_right: "right bottom"
  };
  const tilingValueMap = {
    tile: "repeat",
    horizontal: "repeat-x",
    vertical: "repeat-y",
    none: "no-repeat"
  };

  function applyWallpaperDisplayPreferences() {
    if (!fgImageElementRef) {
      return;
    }
    const sizeValue = sizeValueMap[wallpaperDisplayPrefs.size] || sizeValueMap.full;
    const alignValue = alignValueMap[wallpaperDisplayPrefs.align] || alignValueMap.center;
    const tilingValue = tilingValueMap[wallpaperDisplayPrefs.tiling] || tilingValueMap.none;
    fgImageElementRef.style.backgroundSize = sizeValue;
    fgImageElementRef.style.backgroundPosition = alignValue;
    fgImageElementRef.style.backgroundRepeat = tilingValue;
  }

  function loadWallpaperDisplayPreferences() {
    if (!(browserAPI?.storage?.local)) {
      applyWallpaperDisplayPreferences();
      startAutoCarousel(WALLPAPER_PREF_DEFAULTS.autoCarouselIntervalMinutes);
      return;
    }
    browserAPI.storage.local.get(WALLPAPER_PREF_DEFAULTS, (items) => {
      wallpaperDisplayPrefs = {
        size: items.size || WALLPAPER_PREF_DEFAULTS.size,
        align: items.align || WALLPAPER_PREF_DEFAULTS.align,
        tiling: items.tiling || WALLPAPER_PREF_DEFAULTS.tiling
      };
      applyWallpaperDisplayPreferences();
      startAutoCarousel(items.autoCarouselIntervalMinutes || WALLPAPER_PREF_DEFAULTS.autoCarouselIntervalMinutes);
    });
  }

  function updateWallpaperPrefsFromChanges(changes) {
    const prefKeys = ["size", "align", "tiling"];
    let updated = false;
    prefKeys.forEach((key) => {
      if (Object.prototype.hasOwnProperty.call(changes, key)) {
        const nextValue = changes[key]?.newValue || WALLPAPER_PREF_DEFAULTS[key];
        wallpaperDisplayPrefs[key] = nextValue;
        updated = true;
      }
    });
    if (Object.prototype.hasOwnProperty.call(changes, "autoCarouselIntervalMinutes")) {
      const interval = changes.autoCarouselIntervalMinutes?.newValue || WALLPAPER_PREF_DEFAULTS.autoCarouselIntervalMinutes;
      startAutoCarousel(interval);
    }
    if (updated) {
      applyWallpaperDisplayPreferences();
    }
    return updated;
  }

  class Binding {
    constructor() {
      const bgElement = document.body.querySelector("#backgroundImage");
      const fgImageElement = document.body.querySelector("#foregroundImage");
      const avatarElement = document.body.querySelector("#avatar");
      const avatarImageElement = document.body.querySelector("#avatarImage");
      const illustTitleElement = document.body.querySelector("#illustTitle");
      const illustNameElement = document.body.querySelector("#illustName");
      const refreshElement = document.body.querySelector("#refreshButton");
      const containerElement = document.body.querySelector("#container");
      const wallpaperElement = document.body.querySelector("#wallpaper");
      const illustInfoElement = document.body.querySelector("#illustInfo");
      const loadingSpinnerElement = document.body.querySelector("#loadingSpinner");
      this.containerElement = containerElement;
      this.illustInfoElement = illustInfoElement;
      this.refreshElement = refreshElement;
      this.loadingSpinnerElement = loadingSpinnerElement;

      const userNameBinding = (v) => {
        avatarImageElement.title = v;
        let e = illustNameElement.querySelector("a");
        e.text = v;
        let sw = e.scrollWidth;
        if (sw > 133) {
          let cutIndex = Math.floor((e.text.length * 123) / sw);
          e.text = v.slice(0, cutIndex) + "...";
        }
      };
      const userIdUrlBinding = (v) => {
        illustNameElement.querySelector("a").href = v;
      };
      const titleBinding = (v) => {
        illustTitleElement.title = v;
        let e = illustTitleElement.querySelector("a");
        e.text = v;
        let sw = e.scrollWidth;
        if (sw > 133) {
          let cutIndex = Math.floor((e.text.length * 123) / sw);
          e.text = v.slice(0, cutIndex) + "...";
        }
      };
      const illustIdUrlBinding = (v) => {
        illustTitleElement.querySelector("a").href = v;
      };
      const avatarBinding = (v) => {
        avatarElement.href = v;
      };
      const avatarImageBinding = (v) => {
        avatarImageElement.style["background-image"] = `url(${v})`;
      };
      const bgImageBinding = (v) => {
        bgElement.style["background-image"] = `url(${v})`;
      };
      const fgElementBinding = (v) => {
        fgImageElement.style["background-image"] = `url(${v})`;
      };
      fgImageElementRef = fgImageElement;
      loadWallpaperDisplayPreferences();
      this.ref = {
        userName: [userNameBinding],
        userIdUrl: [userIdUrlBinding, avatarBinding],
        illustIdUrl: [illustIdUrlBinding],
        title: [titleBinding],
        profileImageUrl: [avatarImageBinding],
        imageObjectUrl: [bgImageBinding, fgElementBinding],
      };

      refreshElement.addEventListener("click", sendRefreshMessage);
      this.illustInfoFadeOutTimeoutId = null;
      illustInfoElement.addEventListener("mouseleave", () => {
        this.illustInfoFadeOutTimeoutId = setTimeout(() => {
          this.illustInfoElement.className = "unfocused";
        }, 10000);
      });
      illustInfoElement.addEventListener("mouseenter", () => {
        illustInfoElement.className = "focused";
        clearTimeout(this.illustInfoFadeOutTimeoutId);
      });
      illustInfoElement.addEventListener("mouseover", () => {
        illustInfoElement.className = "focused";
        clearTimeout(this.illustInfoFadeOutTimeoutId);
      });
    }
  }
  var binding = null;
  function initApplication() {
    binding = new Binding();
    // Download button
    const downloadButton = document.getElementById("downloadButton");
    if (downloadButton) {
      downloadButton.addEventListener("click", () => {
        if (currentArtwork && currentArtwork.imageObjectUrl) {
          const link = document.createElement('a');
          link.href = currentArtwork.imageObjectUrl;
          link.download = `pixiv-demo-${Date.now()}.jpg`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      });
    }
  }

  const toggleSpinnerVisibility = (shouldShow) => {
    const spinner = binding?.loadingSpinnerElement;
    if (!spinner) {
      return;
    }
    spinner.classList.toggle("hidden", !shouldShow);
  };

  const showSpinnerIfBlank = () => {
    if (binding?.containerElement?.classList.contains("notReady")) {
      toggleSpinnerVisibility(true);
    }
  };

  async function changeElement(illustObject) {
    if (!illustObject) {
      if (binding?.containerElement?.classList.contains("notReady")) {
        toggleSpinnerVisibility(true);
      }
      return;
    }
    currentArtwork = illustObject;
    for (let k in binding.ref) {
      if (illustObject.hasOwnProperty(k)) {
        let value = illustObject[k];
        if (value === null || value === undefined) {
          if (k === 'userName' || k === 'title') value = '';
        }
        for (let o of binding.ref[k]) {
          o(value);
        }
      }
    }
    binding.containerElement.classList.toggle("notReady", false);
    toggleSpinnerVisibility(false);
    clearTimeout(binding.illustInfoFadeOutTimeoutId);
    binding.illustInfoFadeOutTimeoutId = setTimeout(() => {
      binding.illustInfoElement.className = "unfocused";
    }, 10000);
    // Start prefetch for next
    webQueue.startPrefetch();
  }

  const isExtensionContext = () => !!(browserAPI && browserAPI.runtime && typeof browserAPI.runtime.sendMessage === 'function');

  async function fetchArtworkFallback() {
    // Use Picsum list API to fetch a random image and craft an object similar to the extension
    try {
      // Fetch a small list for randomness; prefer https://picsum.photos/v2/list
      const page = Math.floor(Math.random() * 5) + 1;
      const listRes = await fetch(`https://picsum.photos/v2/list?page=${page}&limit=100`);
      if (!listRes.ok) {
        throw new Error('Failed to fetch list');
      }
      const list = await listRes.json();
      if (!Array.isArray(list) || list.length === 0) {
        throw new Error('Invalid list');
      }
      const item = list[Math.floor(Math.random() * list.length)];
      const id = item.id;
      const width = 1920;
      const height = 1080;
      const imageUrl = `https://picsum.photos/id/${id}/${width}/${height}`;
      const profileUrl = `#`; // no profile link for picsum
      const author = item.author || 'PixTab Demo';
      return {
        userName: author,
        userIdUrl: '#',
        title: `Demo: ${author}`,
        illustIdUrl: '#',
        profileImageUrl: `https://i.pravatar.cc/64?u=${id}`,
        imageObjectUrl: imageUrl
      };
    } catch (e) {
      console.warn('Fallback fetch failed', e);
      // Fallback to single random image
      const id = Math.floor(Math.random() * 1000) + 1;
      const imageUrl = `https://picsum.photos/id/${id}/1920/1080`;
      const profileUrl = `https://i.pravatar.cc/64?u=${id}`;
      return {
        userName: 'PixTab Demo',
        userIdUrl: '#',
        title: `Demo image #${id}`,
        illustIdUrl: '#',
        profileImageUrl: profileUrl,
        imageObjectUrl: imageUrl
      };
    }
  }

  const sendRefreshMessage = (() => {
    let isRequestInProgress = false;
    const setRefreshing = (state) => {
      const refreshButton = binding?.refreshElement;
      if (!refreshButton) {
        return;
      }
      refreshButton.classList.toggle("loading", state);
      refreshButton.setAttribute("aria-busy", state ? "true" : "false");
    };
    return () => {
      if (isRequestInProgress) {
        return;
      }
      isRequestInProgress = true;
      setRefreshing(true);
      showSpinnerIfBlank();
      // If extension runtime is available, use it; otherwise use web fallback
      if (isExtensionContext()) {
        browserAPI.runtime.sendMessage({ action: "requestArtwork" }, (res) => {
          if (browserAPI.runtime.lastError) {
            console.warn("Context invalidated, message could not be processed:", browserAPI.runtime.lastError.message);
            setRefreshing(false);
            isRequestInProgress = false;
            return;
          }
          Promise.resolve(changeElement(res)).finally(() => {
            setRefreshing(false);
            isRequestInProgress = false;
          });
        });
      } else {
        // web fallback
        let artwork = webQueue.getNextArtwork();
        if (!artwork) {
          artwork = await fetchArtworkFallback();
        }
        Promise.resolve(changeElement(artwork)).finally(() => {
          setRefreshing(false);
          isRequestInProgress = false;
        });
      }
    };
  })();

  initApplication();
  // settings button: open extension options when clicked
  const settingsElement = document.body.querySelector("#settingsButton");
  const settingsOverlay = document.getElementById("settingsOverlay");
  const settingsFrame = document.getElementById("settingsFrame");

  const openSettingsOverlay = () => {
    if (!settingsOverlay) {
      return;
    }
    settingsOverlay.classList.add("visible");
    settingsOverlay.setAttribute("aria-hidden", "false");
    document.body.classList.add("settings-open");
  };

  const closeSettingsOverlay = () => {
    if (!settingsOverlay) {
      return;
    }
    settingsOverlay.classList.remove("visible");
    settingsOverlay.setAttribute("aria-hidden", "true");
    document.body.classList.remove("settings-open");
    if (settingsFrame?.contentWindow) {
      settingsFrame.contentWindow.postMessage({ type: "overlayClosed" }, "*");
    }
  };

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && settingsOverlay?.classList.contains("visible")) {
      closeSettingsOverlay();
    }
  });

  settingsOverlay?.addEventListener("click", (event) => {
    if (event.target === settingsOverlay) {
      closeSettingsOverlay();
    }
  });

  window.addEventListener("message", (event) => {
    if (event?.data?.type === "closeOptionsPanel") {
      closeSettingsOverlay();
    }
  });

  if (settingsElement) {
    settingsElement.addEventListener("click", () => {
      openSettingsOverlay();
    });
  }

  // when options/config change, refresh image to reflect new filters
  if (browserAPI && browserAPI.storage && browserAPI.storage.onChanged) {
    browserAPI.storage.onChanged.addListener((changes, area) => {
      if (area === 'local') {
        const prefChanged = updateWallpaperPrefsFromChanges(changes);
        const hasOtherChanges = Object.keys(changes).some((key) => !["size", "align", "tiling"].includes(key));
        if (hasOtherChanges) {
          try {
            sendRefreshMessage();
          } catch (e) {
            console.warn('Failed to refresh after config change', e);
          }
        } else if (!prefChanged) {
          // no action needed
        }
      }
    });
  }

  sendRefreshMessage();
  console.log("content script loaded");
})();
