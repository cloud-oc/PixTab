import { initThemeSync } from "./theme.js";
import browserAPI from "../shared/browser-polyfill.js";
import { unzipSync } from "../shared/fflate.module.js";

(function () {
  const WALLPAPER_PREF_DEFAULTS = Object.freeze({
    size: "best_fit",
    align: "center",
    tiling: "none"
  });
  let wallpaperDisplayPrefs = { ...WALLPAPER_PREF_DEFAULTS };
  let fgImageElementRef = null;
  let bgImageElementRef = null;
  const ugoiraFrameCache = new Map();
  initThemeSync();

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
      return;
    }
    browserAPI.storage.local.get(WALLPAPER_PREF_DEFAULTS, (items) => {
      wallpaperDisplayPrefs = {
        size: items.size || WALLPAPER_PREF_DEFAULTS.size,
        align: items.align || WALLPAPER_PREF_DEFAULTS.align,
        tiling: items.tiling || WALLPAPER_PREF_DEFAULTS.tiling
      };
      applyWallpaperDisplayPreferences();
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
    if (updated) {
      applyWallpaperDisplayPreferences();
    }
    return updated;
  }

  const applyFrameUrl = (url) => {
    if (bgImageElementRef) {
      bgImageElementRef.style["background-image"] = `url(${url})`;
    }
    if (fgImageElementRef) {
      fgImageElementRef.style["background-image"] = `url(${url})`;
    }
  };

  async function blobToDataUrl(blob) {
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  async function decodeUgoiraFrames(ugoiraPayload) {
    if (!ugoiraPayload || !ugoiraPayload.zipUrl || !ugoiraPayload.frames || !ugoiraPayload.frames.length) {
      return null;
    }
    if (ugoiraFrameCache.has(ugoiraPayload.zipUrl)) {
      return ugoiraFrameCache.get(ugoiraPayload.zipUrl);
    }
    // Fetch zip via background script to bypass CORS/Referer issues
    const zipDataUrl = await browserAPI.runtime.sendMessage({
      action: "fetchUgoiraZip",
      url: ugoiraPayload.zipUrl
    });
    
    if (!zipDataUrl) {
      throw new Error("Failed to fetch ugoira zip via background");
    }

    // Convert DataURL to Uint8Array
    const base64Content = zipDataUrl.split(',')[1];
    const binaryString = atob(base64Content);
    const len = binaryString.length;
    const zipBytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        zipBytes[i] = binaryString.charCodeAt(i);
    }
    const files = unzipSync(zipBytes);
    const mimeType = ugoiraPayload.mimeType || "image/jpeg";
    const frames = [];
    for (const frame of ugoiraPayload.frames) {
      const fileData = files[frame.file];
      if (!fileData) {
        continue;
      }
      const dataUrl = await blobToDataUrl(new Blob([fileData], { type: mimeType }));
      frames.push({ url: dataUrl, delay: frame.delay || 60 });
    }
    if (!frames.length) {
      throw new Error("No ugoira frames decoded");
    }
    ugoiraFrameCache.set(ugoiraPayload.zipUrl, frames);
    return frames;
  }

  const ugoiraController = {
    timer: null,
    playToken: 0,
    frames: [],
    currentIndex: 0,
    isPlaying: false,
    
    stop() {
      this.playToken++;
      if (this.timer) {
        clearTimeout(this.timer);
        this.timer = null;
      }
      this.isPlaying = false;
      this.updateButtonState();
    },

    play() {
      if (!this.frames || !this.frames.length) return;
      this.isPlaying = true;
      this.updateButtonState();
      
      const token = this.playToken;
      const step = () => {
        if (token !== this.playToken || !this.isPlaying) return;
        
        const frame = this.frames[this.currentIndex];
        applyFrameUrl(frame.url);
        const delay = Math.max(30, Number(frame.delay) || 60);
        this.currentIndex = (this.currentIndex + 1) % this.frames.length;
        this.timer = setTimeout(step, delay);
      };
      step();
    },
    
    toggle() {
      if (this.isPlaying) {
        this.stop(); // Pauses effectively since we don't reset index
        // But stop() increments token, which kills the loop.
        // We want to be able to resume.
        // The play() method uses current index.
        // So calling play() again works fine.
        // Wait, stop() sets isPlaying=false.
      } else {
        this.play();
      }
    },

    async startNew(ugoiraPayload) {
      this.stop(); // Stop previous
      this.frames = [];
      this.currentIndex = 0;
      
      try {
        const frames = await decodeUgoiraFrames(ugoiraPayload);
        if (!frames || !frames.length) return;
        
        this.frames = frames;
        // Auto play on load
        this.play();
        this.showButton(true);
      } catch (e) {
        console.warn("Failed to play ugoira", e);
        this.showButton(false);
      }
    },

    updateButtonState() {
      const btn = document.getElementById('playPauseButton');
      if (!btn) return;
      const icon = btn.querySelector('.material-symbols-outlined');
      if (icon) {
        icon.textContent = this.isPlaying ? 'pause' : 'play_arrow';
        // Optional: padding adjustment for triangle icon centering if needed
        // icon.style.marginLeft = this.isPlaying ? '0' : '4px'; 
      }
    },

    showButton(show) {
      const btn = document.getElementById('playPauseButton');
      if (!btn) return;
      if (show) {
        btn.classList.remove('hidden');
        this.updateButtonState();
      } else {
        btn.classList.add('hidden');
      }
    }
  };

  // Setup button listener
  document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('playPauseButton');
    if (btn) {
      btn.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent clicking through to wallpaper logic if any
        ugoiraController.toggle();
      });
    }
  });

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
      bgImageElementRef = bgElement;
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
  }

  function setLoadFailedState(isFailed) {
    try {
      const container = binding?.containerElement;
      if (!container) return;
      container.classList.toggle('load-failed', !!isFailed);
      const core = document.querySelector('.pix-spinner__core');
      if (!core) return;
      // Read computed styles from the nearest themed container (fall back to body).
      const styleSource = container || document.body;
      const rootStyle = getComputedStyle(styleSource);
      if (isFailed) {
        // Prefer a single shared RGB variable so hue is identical between the
        // loading background tint and the breathing core. Construct RGBA values
        // from the theme-aware --fail-red-rgb and alpha variables. Fall back
        // to pre-existing variables if the new ones are not present.
        const failRgb = rootStyle.getPropertyValue('--fail-red-rgb').trim();
        if (failRgb) {
          // Use opaque rgb() constructed from --fail-red-rgb so hue matches
          // the background tint exactly and there is no transparency.
          const fillColor = `rgb(${failRgb})`;
          const glowColor = `rgb(${failRgb})`;
          core.style.fill = fillColor;
          core.style.filter = `drop-shadow(0 0 30px ${glowColor})`;
        } else {
          // compatibility fallback: use the older dedicated variables
          const fill = rootStyle.getPropertyValue('--spinner-core-color-fail').trim() || '';
          const glow = rootStyle.getPropertyValue('--spinner-core-glow-fail').trim() || '';
          core.style.fill = fill;
          core.style.filter = `drop-shadow(0 0 30px ${glow})`;
        }
      } else {
        // remove inline overrides so CSS rules apply
        core.style.fill = '';
        core.style.filter = '';
      }
    } catch (e) {
      // ignore
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
    ugoiraController.stop();
    // Also hide button by default until loaded
    ugoiraController.showButton(false);
    
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
    if (illustObject.ugoira) {
      ugoiraController.startNew(illustObject.ugoira);
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
      browserAPI.runtime.sendMessage({ action: "requestArtwork" }, (res) => {
        const lastError = browserAPI.runtime.lastError;
        if (lastError) {
          if (lastError.message && lastError.message.includes('Could not establish connection')) {
            // 静默忽略 Manifest V3 service worker 休眠导致的错误
            setRefreshing(false);
            isRequestInProgress = false;
            return;
          }
          console.warn("Extension messaging error:", lastError.message);
          setRefreshing(false);
          isRequestInProgress = false;
          return;
        }
        // Update failure indicator based on response (null indicates failure)
        try {
          setLoadFailedState(!res);
        } catch (e) {
          // ignore if binding not ready
        }

        Promise.resolve(changeElement(res)).finally(() => {
          setRefreshing(false);
          isRequestInProgress = false;
        });
      });
    };
  })();

  initApplication();
  // Listen for background load success/failure notifications to update UI state
  if (browserAPI && browserAPI.runtime && browserAPI.runtime.onMessage) {
    browserAPI.runtime.onMessage.addListener((msg) => {
      try {
        if (!binding) return;
        if (msg && msg.action === 'artworkLoadFailed') {
          setLoadFailedState(true);
        } else if (msg && msg.action === 'artworkLoadSucceeded') {
          setLoadFailedState(false);
        }
      } catch (e) {
        // swallowing errors to avoid UI disruption
        console.warn('Failed to handle artwork load status message', e);
      }
    });
  }
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
