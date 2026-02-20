import { initThemeSync } from "../shared/theme.js";
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

  // Safe message sending with timeout and retry
  async function safeRuntimeMessage(message, options = {}) {
    const {
      timeout = 10000,
      retries = 2,
      onServiceWorkerSleep = null
    } = options;

    let lastErrorMsg = '';
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await Promise.race([
          browserAPI.runtime.sendMessage(message),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('MESSAGE_TIMEOUT')), timeout)
          )
        ]);
        return response;
      } catch (e) {
        const lastError = browserAPI.runtime.lastError || e;
        const errorMsg = lastError?.message || e?.message || '';
        lastErrorMsg = errorMsg;

        const isChannelClosedAsyncResponse =
          errorMsg.includes('A listener indicated an asynchronous response by returning true, but the message channel closed before a response was received');

        // Service worker sleeping or channel closed while awaiting async response
        // - both are expected transient cases in MV3 and should be handled quietly.
        if (errorMsg.includes('Could not establish connection') ||
          errorMsg.includes('Extension context invalidated') ||
          isChannelClosedAsyncResponse) {
          if (attempt < retries) {
            console.log('Service worker sleeping, retrying...');
            await new Promise(r => setTimeout(r, 500 * (attempt + 1)));
            continue;
          }
          // Final attempt failed due to sleeping worker
          if (onServiceWorkerSleep) {
            return onServiceWorkerSleep();
          }
          return null;
        }

        // Timeout or other errors - retry if attempts remain
        if (attempt < retries) {
          // Silent retry for timeout and transient errors
          await new Promise(r => setTimeout(r, 300 * (attempt + 1)));
          continue;
        }

        // Only warn on final failure, and only if it's not a timeout (those are expected)
        if (errorMsg !== 'MESSAGE_TIMEOUT') {
          console.warn('Runtime message failed after retries:', errorMsg);
        }
        return null;
      }
    }
    return null;
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



  async function decodeUgoiraFrames(ugoiraPayload) {
    if (!ugoiraPayload || !ugoiraPayload.zipUrl || !ugoiraPayload.frames || !ugoiraPayload.frames.length) {
      return null;
    }
    if (ugoiraFrameCache.has(ugoiraPayload.zipUrl)) {
      return ugoiraFrameCache.get(ugoiraPayload.zipUrl);
    }
    // Fetch zip via background script with retry mechanism
    const MAX_RETRIES = 3;
    let zipDataUrl = null;
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        zipDataUrl = await safeRuntimeMessage({
          action: "fetchUgoiraZip",
          url: ugoiraPayload.zipUrl
        }, {
          timeout: 30000,  // 30s timeout for large zip files
          retries: 1,
          onServiceWorkerSleep: () => {
            console.warn('Service worker sleeping, ugoira playback unavailable');
            return null;
          }
        });

        if (zipDataUrl) break;
      } catch (e) {
        console.warn(`Ugoira ZIP fetch attempt ${attempt + 1} failed:`, e);
      }

      if (attempt < MAX_RETRIES - 1) {
        await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
      }
    }

    if (!zipDataUrl) {
      throw new Error("Failed to fetch ugoira zip after retries");
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
      const dataUrl = URL.createObjectURL(new Blob([fileData], { type: mimeType }));
      frames.push({ url: dataUrl, delay: frame.delay || 60 });
    }
    if (!frames.length) {
      throw new Error("No ugoira frames decoded");
    }
    ugoiraFrameCache.set(ugoiraPayload.zipUrl, frames);
    return frames;
  }

  function preDecodeFrames(frames) {
    if (!frames || !frames.length) return;

    // Create Image elements immediately
    frames.forEach(frame => {
      if (!frame.imageElement) {
        const img = new Image();
        img.src = frame.url;
        frame.imageElement = img;
      }
    });

    // Prioritized decoding queue
    const queue = [...frames]; // copy
    const MAX_CONCURRENCY = 6;
    let active = 0;

    const processQueue = () => {
      while (active < MAX_CONCURRENCY && queue.length > 0) {
        const frame = queue.shift();
        if (frame.decoded) continue;

        active++;
        const img = frame.imageElement;

        // Race decode against a timeout to prevent hanging
        const decodePromise = img.decode().catch(() => { });
        const timeoutPromise = new Promise(resolve => setTimeout(resolve, 200));

        Promise.race([decodePromise, timeoutPromise]).finally(() => {
          frame.decoded = true;
          active--;
          processQueue();
        });
      }
    };

    processQueue();
  }

  const ugoiraController = {
    canvasContext: null,
    canvasElement: null,
    frames: [],
    currentIndex: 0,
    isPlaying: false,
    playToken: 0,
    animationFrameId: null,
    lastFrameTime: 0,
    firstFrameDrawn: false,

    getCanvas() {
      if (!this.canvasElement) {
        let canvas = document.getElementById('ugoiraCanvas');
        if (!canvas) {
          canvas = document.createElement('canvas');
          canvas.id = 'ugoiraCanvas';
          canvas.style.position = 'fixed';
          canvas.style.top = '0';
          canvas.style.left = '0';
          canvas.style.width = '100%';
          canvas.style.height = '100%';
          canvas.style.objectFit = 'contain';
          canvas.style.zIndex = '-1'; // Same as #wallpaper
          canvas.style.pointerEvents = 'none';
          document.body.appendChild(canvas);
        }
        this.canvasElement = canvas;
        this.canvasContext = canvas.getContext('2d');
      }
      return this.canvasElement;
    },

    stop() {
      this.playToken++;
      if (this.animationFrameId) {
        cancelAnimationFrame(this.animationFrameId);
        this.animationFrameId = null;
      }
      this.isPlaying = false;
      this.updateButtonState();

      // Clear canvas
      if (this.canvasElement && this.canvasContext) {
        this.canvasContext.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height);
        this.canvasElement.style.display = 'none';
      }

      // Restore background visibility
      document.getElementById('backgroundImage')?.classList.remove('animating');
      document.getElementById('foregroundImage')?.classList.remove('animating');
    },

    pause() {
      this.playToken++; // Invalidate current loop token
      if (this.animationFrameId) {
        cancelAnimationFrame(this.animationFrameId);
        this.animationFrameId = null;
      }
      this.isPlaying = false;
      this.updateButtonState();
      // Do NOT clear canvas or restore background visibility
      // The current frame remains drawn on the canvas
    },

    play() {
      if (!this.frames || !this.frames.length) return;
      this.isPlaying = true;
      this.updateButtonState();

      const canvas = this.getCanvas();
      canvas.style.display = 'block';
      this.firstFrameDrawn = false;

      // Removed immediate hiding of background to prevent black screen if first frame isn't ready

      const ctx = this.canvasContext;

      // Set canvas size to screen size for proper rendering
      const rect = document.body.getBoundingClientRect();
      // Use window dimensions as fallback if body has no size
      const targetWidth = rect.width > 0 ? rect.width : window.innerWidth;
      const targetHeight = rect.height > 0 ? rect.height : window.innerHeight;
      if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
        canvas.width = targetWidth;
        canvas.height = targetHeight;
      }

      const token = this.playToken;
      this.lastFrameTime = performance.now();
      let accumulatedTime = 0;

      // Helper to draw a frame covering/containing based on pref would be ideal, 
      // but for now, we'll implement a simple "cover" or "contain" logic matching CSS.
      // Assuming "cover" behavior similar to CSS background-size: cover for simplicity,
      // or "contain" if that's the default.
      // Let's implement "contain" (best_fit) as it's the default in preferences.

      const drawFrame = (img) => {
        if (!img || !img.complete || img.naturalWidth === 0 || img.naturalHeight === 0) return false;
        const cw = canvas.width;
        const ch = canvas.height;
        if (cw === 0 || ch === 0) return false; // Canvas not visible or 0 size

        // Removed clearRect to prevent black flashing if draw fails or lags.
        // The background cover draw below covers the entire canvas anyway. 
        // ctx.clearRect(0, 0, cw, ch);

        const imgRatio = img.naturalWidth / img.naturalHeight;
        const canvasRatio = cw / ch;

        // 1. Draw Blurred Background (Cover)
        ctx.filter = 'blur(18px)';
        let bw, bh, bx, by;
        // Cover logic:
        if (imgRatio > canvasRatio) {
          // Image wider than canvas: height=100%, width=auto (cropped)
          bh = ch;
          bw = ch * imgRatio;
          by = 0;
          bx = (cw - bw) / 2;
        } else {
          // Image taller than canvas: width=100%, height=auto (cropped)
          bw = cw;
          bh = cw / imgRatio;
          bx = 0;
          by = (ch - bh) / 2;
        }
        // Draw slightly larger to avoid edge artifacts from blur? No, standard cover is usually fine.
        ctx.drawImage(img, bx, by, bw, bh);

        // 2. Draw Sharp Foreground (Contain)
        ctx.filter = 'none';
        let dw, dh, dx, dy;

        if (imgRatio > canvasRatio) {
          // Contain logic: width=100%, height=auto (letterbox)
          dw = cw;
          dh = cw / imgRatio;
          dx = 0;
          dy = (ch - dh) / 2;
        } else {
          // Contain logic: height=100%, width=auto (pillarbox)
          dh = ch;
          dw = ch * imgRatio;
          dy = 0;
          dx = (cw - dw) / 2;
        }
        ctx.drawImage(img, dx, dy, dw, dh);
        return true;
      };

      const ensureBackgroundHidden = () => {
        if (!this.isPlaying) return;
        document.getElementById('backgroundImage')?.classList.add('animating');
        document.getElementById('foregroundImage')?.classList.add('animating');
      };

      const loop = (timestamp) => {
        if (token !== this.playToken || !this.isPlaying) return;

        const deltaTime = timestamp - this.lastFrameTime;
        this.lastFrameTime = timestamp;

        // If we haven't drawn the first frame yet, don't accumulate time.
        // This effectively pauses the animation logic on frame 0 until it is ready.
        if (this.firstFrameDrawn) {
          accumulatedTime += deltaTime;
        }

        let frame = this.frames[this.currentIndex];

        // Critical: Ensure first frame is drawn before advancing
        if (!this.firstFrameDrawn) {
          // Try to draw the current frame (which should be frame 0)
          if (frame.imageElement && drawFrame(frame.imageElement)) {
            this.firstFrameDrawn = true;
            ensureBackgroundHidden();
            // Reset timing to start smooth animation from now
            accumulatedTime = 0;
          } else {
            // Not ready yet, wait for next tick.
            this.animationFrameId = requestAnimationFrame(loop);
            return;
          }
        }

        let delay = Math.max(1, Number(frame.delay) || 60);

        if (accumulatedTime >= delay) {
          const nextIndex = (this.currentIndex + 1) % this.frames.length;
          // Check if next frame's image is actually ready (loaded and has dimensions)
          const nextFrame = this.frames[nextIndex];
          const isNextFrameReady = nextFrame.imageElement &&
            nextFrame.imageElement.complete &&
            nextFrame.imageElement.naturalWidth > 0;
          if (isNextFrameReady) {
            accumulatedTime -= delay;
            this.currentIndex = nextIndex;
            frame = this.frames[this.currentIndex];

            // Draw the final frame after catch-up
            if (drawFrame(frame.imageElement)) {
              this.firstFrameDrawn = true;
              ensureBackgroundHidden();
            }

            delay = Math.max(1, Number(frame.delay) || 60);
            while (accumulatedTime >= delay) {
              const skipNextIndex = (this.currentIndex + 1) % this.frames.length;
              const skipFrame = this.frames[skipNextIndex];
              const isSkipFrameReady = skipFrame.imageElement &&
                skipFrame.imageElement.complete &&
                skipFrame.imageElement.naturalWidth > 0;
              if (!isSkipFrameReady) break;

              accumulatedTime -= delay;
              this.currentIndex = skipNextIndex;
              frame = this.frames[this.currentIndex];

              // Skip drawing for skipped frames

              delay = Math.max(1, Number(frame.delay) || 60);
            }
            // Draw the final frame after catch-up
            if (drawFrame(frame.imageElement)) {
              ensureBackgroundHidden();
            }
          }
        }

        this.animationFrameId = requestAnimationFrame(loop);
      };

      // Draw first frame immediately
      // Draw first frame immediately if ready
      if (this.frames[this.currentIndex] && this.frames[this.currentIndex].decoded && this.frames[this.currentIndex].imageElement) {
        if (drawFrame(this.frames[this.currentIndex].imageElement)) {
          this.firstFrameDrawn = true;
          ensureBackgroundHidden();
        }
      }

      this.animationFrameId = requestAnimationFrame(loop);
    },

    toggle() {
      if (this.isPlaying) {
        this.pause();
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

        // Progressive: Start decoding in background, but don't wait
        preDecodeFrames(frames);

        // Mark frame 0 as decoded
        frames[0].decoded = true;

        this.frames = frames;

        // CRITICAL: Wait for the first frame's image to actually load before playing
        const firstImg = this.frames[0].imageElement;
        if (firstImg && !firstImg.complete) {
          await new Promise((resolve) => {
            firstImg.onload = () => {
              console.log("Ugoira: First frame loaded successfully");
              resolve();
            };
            firstImg.onerror = () => {
              console.warn("Ugoira: First frame failed to load");
              resolve(); // Still resolve to allow fallback
            };
            // If already loaded by now (race condition), resolve immediately
            if (firstImg.complete) {
              resolve();
            }
          });
        }

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
      const svg = btn.querySelector('.icon');
      const path = svg?.querySelector('path');
      if (path) {
        // Pause icon: two vertical bars
        // Play icon: triangle pointing right
        path.setAttribute('d', this.isPlaying
          ? 'M6 19h4V5H6v14zm8-14v14h4V5h-4z'
          : 'M8 5v14l11-7z');
      }
      // Toggle state class for CSS styling
      if (this.isPlaying) {
        btn.classList.add('playing');
        btn.classList.remove('paused');
      } else {
        btn.classList.add('paused');
        btn.classList.remove('playing');
      }
    },

    showButton(show) {
      if (show) {
        // If showing generally permitted (has ugoira), update state based on play/pause
        this.updateButtonState();
      } else {
        // Force hide
        const btn = document.getElementById('playPauseButton');
        if (btn) btn.classList.add('hidden');
      }
    }
  };

  // Setup listener
  document.addEventListener('DOMContentLoaded', () => {
    // Button click (if visible)
    const btn = document.getElementById('playPauseButton');
    if (btn) {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        ugoiraController.toggle();
      });
    }

    // Background click to toggle
    // Listen on container because wallpaper is behind maskLayer/others
    const container = document.getElementById('container');
    if (container) {
      container.addEventListener('click', (e) => {
        // Only toggle if ugoira is loaded (frames exist)
        if (ugoiraController.frames && ugoiraController.frames.length > 0) {
          ugoiraController.toggle();
        }
      });
    }

    // Prevent info card clicks from bubbling to wallpaper
    const infoCard = document.getElementById('illustInfo');
    if (infoCard) {
      infoCard.addEventListener('click', (e) => e.stopPropagation());
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
    try {
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
    } catch (e) {
      console.error("changeElement failed", e);
      toggleSpinnerVisibility(false); // Force recover
      setLoadFailedState(true);
    }
  }

  const sendRefreshMessage = (() => {
    let isRequestInProgress = false;
    let loadTimeoutId = null;
    let autoProxyAttempted = false;

    const setRefreshing = (state) => {
      const refreshButton = binding?.refreshElement;
      if (!refreshButton) {
        return;
      }
      refreshButton.classList.toggle("loading", state);
      refreshButton.setAttribute("aria-busy", state ? "true" : "false");
    };

    const enableReverseProxyIfNeeded = () => {
      if (!autoProxyAttempted) {
        autoProxyAttempted = true;
        browserAPI.runtime.sendMessage({ action: "enableReverseProxyAuto" }, (response) => {
          const lastError = browserAPI.runtime.lastError;
          if (lastError) {
            console.warn('Failed to auto-enable reverse proxy:', lastError);
            return;
          }
          if (response && response.success) {
            // Retry loading once after enabling proxy
            console.log('Auto-enabled reverse proxy, retrying artwork request');
            // allow previous call to clear and re-enter
            setTimeout(() => {
              isRequestInProgress = false;
              sendRefreshMessage();
            }, 500);
          }
        });
      }
    };

    const startLoadTimeout = () => {
      clearTimeout(loadTimeoutId);
      loadTimeoutId = setTimeout(() => {
        const container = binding?.containerElement;
        const stillLoading = container ? container.classList.contains('notReady') : true;
        if (isRequestInProgress && stillLoading) {
          enableReverseProxyIfNeeded();
        }
      }, 8000); // 8s timeout
    };

    return async () => {
      if (isRequestInProgress) {
        return;
      }
      isRequestInProgress = true;
      autoProxyAttempted = false;
      setRefreshing(true);
      showSpinnerIfBlank();
      startLoadTimeout();

      const res = await safeRuntimeMessage({ action: "requestArtwork" }, {
        timeout: 15000,
        retries: 1,
        onServiceWorkerSleep: () => {
          console.log('Service worker sleeping during artwork request');
          clearTimeout(loadTimeoutId);
          setRefreshing(false);
          isRequestInProgress = false;
          return null;
        }
      });

      // Update failure indicator based on response (null indicates failure)
      try {
        if (!res) {
          setLoadFailedState(true);
          enableReverseProxyIfNeeded();
        } else {
          setLoadFailedState(false);
        }
      } catch (e) {
        // ignore if binding not ready
      }

      Promise.resolve(changeElement(res))
        .catch(e => {
          console.error("changeElement error:", e);
          setLoadFailedState(true);
          toggleSpinnerVisibility(false);
        })
        .finally(() => {
          clearTimeout(loadTimeoutId);
          setRefreshing(false);
          isRequestInProgress = false;
        });
    };
  })();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApplication);
  } else {
    initApplication();
  }
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
        // Automatic refresh on other settings changes is strictly disabled.
        // Users must manually click the refresh button or reload the page.
      }
    });
  }

  sendRefreshMessage();
  console.log("content script loaded");
})();
