import { defaultConfig, Order, SMode } from "../shared/preferences.js";
import { buildKeywordQuery } from "../shared/keyword-builder.js";
import browserAPI from "../shared/browser-polyfill.js";

const darkModeMediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

function applySystemTheme() {
  const theme = darkModeMediaQuery.matches ? "dark" : "light";
  if (document.body?.dataset?.theme !== theme) {
    document.body.dataset.theme = theme;
  }
}

applySystemTheme();

// Listen for system theme changes
darkModeMediaQuery.addEventListener("change", applySystemTheme);

document.addEventListener("visibilitychange", () => {
  if (!document.hidden) {
    applySystemTheme();
  }
});

const AUTO_SAVE_DEBOUNCE_MS = 500;
let autoSaveTimeoutId = null;

const saveOptions = () => {
  updateKeywords();
  const newConfig = {
    order: document.getElementById('order').value,
    mode: document.getElementById('mode').value,
    blt: document.getElementById('blt').value ? Number(document.getElementById('blt').value) : null,
    bgt: document.getElementById('bgt').value ? Number(document.getElementById('bgt').value) : null,
    s_mode: document.getElementById('s_mode').value,
    type: document.getElementById('type').value,
    aiType: document.getElementById('aiType').value || 'display',
    minWidthPx: document.getElementById('minWidthPx').value ? Number(document.getElementById('minWidthPx').value) : null,
    minHeightPx: document.getElementById('minHeightPx').value ? Number(document.getElementById('minHeightPx').value) : null,
    size: document.getElementById('size').value || 'full',
    align: document.getElementById('align').value || 'center',
    tiling: document.getElementById('tiling').value || 'none',
    orKeywords: document.getElementById('orKeywords').value.trim(),
    minusKeywords: document.getElementById('minusKeywords').value.trim(),
    andKeywords: document.getElementById('andKeywords').value.trim(),
    keywords: document.getElementById('keywords').value.trim()
  };

  browserAPI.storage.local.set(
    newConfig,
    () => {
      console.log("Save config");
      console.log(newConfig);
    }
  );

  browserAPI.runtime.sendMessage({ action: "refreshPreferences" }, (response) => {
    const lastError = browserAPI.runtime.lastError;
    if (lastError) {
      // 仅在调试时输出，生产环境可静默处理
      if (lastError.message && lastError.message.includes('Could not establish connection')) {
        // 静默忽略 Manifest V3 service worker 休眠导致的错误
        return;
      }
      console.warn('Extension messaging error:', lastError.message);
      return;
    }
    // 可根据需要处理 response
  });
};

function scheduleAutoSave() {
  clearTimeout(autoSaveTimeoutId);
  autoSaveTimeoutId = window.setTimeout(saveOptions, AUTO_SAVE_DEBOUNCE_MS);
}

const resetOptions = () => {
  browserAPI.storage.local.set(
    defaultConfig,
    () => {
      console.log("Reset config");
      console.log(defaultConfig);
      let items = defaultConfig;
      document.getElementById('order').value = ensureValidOrderValue(items.order);
      document.getElementById('mode').value = items.mode;
      document.getElementById('blt').value = items.blt;
      document.getElementById('bgt').value = items.bgt;
      document.getElementById('s_mode').value = ensureValidKeywordModeValue(items.s_mode);
      document.getElementById('type').value = items.type;
      document.getElementById('minWidthPx').value = items.minWidthPx ?? "";
      document.getElementById('minHeightPx').value = items.minHeightPx ?? "";
      document.getElementById('size').value = items.size || 'full';
      document.getElementById('align').value = items.align || 'center';
      document.getElementById('tiling').value = items.tiling || 'none';
      document.getElementById('aiType').value = items.aiType || 'display';
      document.getElementById('andKeywords').value = items.andKeywords;
      document.getElementById('orKeywords').value = items.orKeywords;
      document.getElementById('minusKeywords').value = items.minusKeywords;
      updateKeywords();
      enforceBookmarkRange();
      console.log("Reset config");
      console.log(items);
    }
  );
};


const restoreOptions = () => {
  browserAPI.storage.local.get(defaultConfig, (items) => {
    console.log("Load config");
    console.log(items);
    document.getElementById('order').value = ensureValidOrderValue(items.order);
    document.getElementById('mode').value = items.mode;
    document.getElementById('blt').value = items.blt;
    document.getElementById('bgt').value = items.bgt;
    document.getElementById('s_mode').value = ensureValidKeywordModeValue(items.s_mode);
    document.getElementById('type').value = items.type;
    document.getElementById('minWidthPx').value = items.minWidthPx ?? "";
    document.getElementById('minHeightPx').value = items.minHeightPx ?? "";
    document.getElementById('size').value = items.size || 'full';
    document.getElementById('align').value = items.align || 'center';
    document.getElementById('tiling').value = items.tiling || 'none';
    document.getElementById('aiType').value = items.aiType || 'display';
    document.getElementById('andKeywords').value = items.andKeywords;
    document.getElementById('orKeywords').value = items.orKeywords;
    document.getElementById('minusKeywords').value = items.minusKeywords;
    updateKeywords();
    enforceBookmarkRange();
  });
};

function ensureValidOrderValue(orderValue) {
  const orderSelect = document.getElementById('order');
  if (!orderSelect) {
    return orderValue;
  }
  const hasOption = Array.from(orderSelect.options).some((opt) => opt.value === orderValue);
  if (!hasOption) {
    const fallback = Order.ranking_daily;
    browserAPI.storage.local.set({ order: fallback });
    return fallback;
  }
  return orderValue;
}

function ensureValidKeywordModeValue(modeValue) {
  const allowed = Object.values(SMode);
  if (allowed.includes(modeValue)) {
    return modeValue;
  }
  browserAPI.storage.local.set({ s_mode: SMode.s_tag });
  return SMode.s_tag;
}

function parseNullableNumber(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  const numericValue = Number(value);
  return Number.isNaN(numericValue) ? null : numericValue;
}

function enforceBookmarkRange(changedInput) {
  const minInput = document.getElementById('blt');
  const maxInput = document.getElementById('bgt');
  if (!minInput || !maxInput) {
    return;
  }
  const minValue = parseNullableNumber(minInput.value);
  const maxValue = parseNullableNumber(maxInput.value);
  if (minValue === null || maxValue === null) {
    return;
  }
  if (minValue > maxValue) {
    if (changedInput === minInput) {
      maxInput.value = minValue;
    } else if (changedInput === maxInput) {
      minInput.value = maxValue;
    } else {
      maxInput.value = minValue;
    }
  }
}

function updateKeywords() {
  let andKeywords = document.getElementById('andKeywords').value;
  let orKeywords = document.getElementById('orKeywords').value;
  let minusKeywords = document.getElementById('minusKeywords').value;
  let word = buildKeywordQuery(andKeywords, orKeywords, minusKeywords);
  document.getElementById('keywords').value = word;
}

function registerAutoSaveListeners() {
  const autoSaveElements = document.querySelectorAll('input:not([type="hidden"]), select, textarea');
  autoSaveElements.forEach((element) => {
    const eventName = element.tagName === 'SELECT' || element.type === 'checkbox' ? 'change' : 'input';
    element.addEventListener(eventName, scheduleAutoSave);
  });
}

document.getElementById('orKeywords').addEventListener('input', updateKeywords);
document.getElementById('minusKeywords').addEventListener('input', updateKeywords);
document.getElementById('andKeywords').addEventListener('input', updateKeywords);
const minBookmarkInput = document.getElementById('blt');
const maxBookmarkInput = document.getElementById('bgt');
['input', 'change'].forEach((eventName) => {
  minBookmarkInput?.addEventListener(eventName, () => enforceBookmarkRange(minBookmarkInput));
  maxBookmarkInput?.addEventListener(eventName, () => enforceBookmarkRange(maxBookmarkInput));
});
const backToNewTabButton = document.getElementById('backToNewTabButton');
if (backToNewTabButton) {
  backToNewTabButton.addEventListener('click', () => {
    if (window.top !== window) {
      window.parent.postMessage({ type: 'closeOptionsPanel' }, '*');
    } else {
      browserAPI.tabs.create({ url: 'about:newtab' });
      window.close?.();
    }
  });
}
document.addEventListener('DOMContentLoaded', () => {
  restoreOptions();
  registerAutoSaveListeners();
});
document.getElementById('reset').addEventListener('click', resetOptions);

function applyHelperTitles(messages) {
  if (!messages) {
    return;
  }
  const helperMappings = [
    { targetId: 'sizeLabel', helperKey: 'sizeHelper' },
    { targetId: 'alignLabel', helperKey: 'alignHelper' },
    { targetId: 'tilingLabel', helperKey: 'tilingHelper' },
    { targetId: 'resolutionLabel', helperKey: 'resolutionHelper' },
    { targetId: 'aiTypeLabel', helperKey: 'aiTypeHelper' }
  ];
  helperMappings.forEach(({ targetId, helperKey }) => {
    const targetEl = document.getElementById(targetId);
    if (!targetEl) {
      return;
    }
    const helperMessage = messages[helperKey]?.message || '';
    targetEl.title = helperMessage;
  });
}

document.addEventListener("DOMContentLoaded", function () {
  const langSelect = document.getElementById("languageSelect");
  // Backwards compatibility: older saved preferences might contain "zh".
  // The extension ships region-specific Chinese locales (zh-CN, zh-TW) and
  // the legacy `_locales/zh` folder has been removed from the repository.
  // We therefore map saved 'zh' to 'zh-CN' and intentionally avoid listing
  // 'zh' among supported languages to prevent any runtime lookup for it.
  const supportedLanguages = ["en", "zh-CN", "zh-TW", "ja", "ko"];

  function detectBrowserLanguage() {
    const browserLangs = navigator.languages || [navigator.language || "en"];
    for (const lang of browserLangs) {
      const normalized = (lang || "").replace('_', '-');
      // direct match (e.g., zh-CN, zh-TW)
      if (supportedLanguages.includes(normalized)) {
        return normalized;
      }
      const parts = normalized.split('-');
      const shortLang = parts[0]?.toLowerCase();
      if (shortLang === 'zh') {
        // If region explicitly indicates TW/HK/MO, map to zh-TW; otherwise default to zh-CN
        const region = parts[1]?.toLowerCase() || '';
        if (region === 'tw' || region === 'hk' || region === 'mo') {
          return 'zh-TW';
        }
        return 'zh-CN';
      }
      if (supportedLanguages.includes(shortLang)) {
        return shortLang;
      }
    }
    return "en";
  }

  const rawSavedLang = localStorage.getItem("language");
  // Backwards compatibility: older versions may have used 'zh' as value
  let savedLang = rawSavedLang;
  if (savedLang === 'zh') {
    savedLang = 'zh-CN';
  }
  // Validate savedLang
  if (!savedLang || !supportedLanguages.includes(savedLang)) {
    savedLang = null;
  }
  const defaultLang = savedLang || detectBrowserLanguage();
  if (!rawSavedLang) {
    localStorage.setItem("language", defaultLang);
  }
  // If the saved/default lang isn't available as an option in the select, fallback to 'en'
  if (!Array.from(langSelect.options).some((o) => o.value === defaultLang)) {
    langSelect.value = 'en';
  } else {
    langSelect.value = defaultLang;
  }

  function loadTranslations(lang) {
    // 兼容中划线和下划线
    const tryPaths = [
      `_locales/${lang}/messages.json`,
      `_locales/${lang.replace('-', '_')}/messages.json`
    ];
    (function tryFetch(i) {
      fetch(tryPaths[i])
        .then((response) => {
          if (!response.ok) throw new Error("Not found");
          return response.json();
        })
        .then((data) => {
          document.querySelectorAll("[id]").forEach((el) => {
            if (data[el.id]) {
              el.textContent = data[el.id].message;
            }
          });
          document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
            const key = el.getAttribute("data-i18n-placeholder");
            if (data[key]) {
              el.placeholder = data[key].message;
            }
          });
          const backLabel = document.getElementById("backToNewTabLabel");
          const backButton = document.getElementById("backToNewTabButton");
          if (backLabel && backButton) {
            backButton.title = backLabel.textContent;
          }
          applyHelperTitles(data);
        })
        .catch((error) => {
          if (i + 1 < tryPaths.length) {
            tryFetch(i + 1);
          } else {
            console.error("Error loading translations:", error);
          }
        });
    })(0);
  }

  loadTranslations(defaultLang);

  langSelect.addEventListener("change", (event) => {
    const selectedLang = event.target.value;
    localStorage.setItem("language", selectedLang);
    loadTranslations(selectedLang);
  });
});
