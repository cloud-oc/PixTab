import { Mode, Order, SMode } from "../shared/preferences.js";
import { buildKeywordQuery } from "../shared/keyword-builder.js";
import { loadPreferences } from "../shared/storage.js";
import browserAPI, { getExtensionId, storageSessionGet, storageSessionSet, IS_FIREFOX } from "../shared/browser-polyfill.js";

browserAPI.runtime.onInstalled.addListener((details) => {
  // Firefox doesn't support extension IDs (e.g. "pixtab@pixtab.extension") in initiatorDomains.
  // For Firefox, we omit initiatorDomains entirely - the extension context is scoped by default.
  // For Chrome, we use the extension ID to restrict the rule to only requests from this extension.
  const baseCondition = {
    "urlFilter": "*://*.pixiv.net/*",
    "resourceTypes": ["xmlhttprequest"]
  };
  
  const pximgCondition = {
    "urlFilter": "*://*.pximg.net/*",
    "resourceTypes": ["xmlhttprequest"]
  };

  // Only add initiatorDomains for Chrome (where extension ID format is valid)
  if (!IS_FIREFOX) {
    const extensionId = getExtensionId();
    baseCondition.initiatorDomains = [extensionId];
    pximgCondition.initiatorDomains = [extensionId];
  }

  const RULE = [
    {
      "id": 1,
      "priority": 1,
      "action": {
        "type": "modifyHeaders",
        "requestHeaders": [
          {
            "header": "referer",
            "operation": "set",
            "value": "https://www.pixiv.net/"
          }
        ]
      },
      "condition": baseCondition
    },
    {
      "id": 2,
      "priority": 1,
      "action": {
        "type": "modifyHeaders",
        "requestHeaders": [
          {
            "header": "referer",
            "operation": "set",
            "value": "https://www.pixiv.net/"
          }
        ]
      },
      "condition": pximgCondition
    }
  ];
  browserAPI.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: RULE.map(o => o.id),
    addRules: RULE,
  });
});

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min) + min);
}
class ArtworkQueue {
  constructor(maxsize) {
    this.maxsize = maxsize;
    this.array = [];
  }
  empty() {
    return this.array.length === 0;
  }
  full() {
    return this.array.length === this.maxsize;
  }
  size() {
    return this.array.length;
  }
  capacity() {
    return this.maxsize;
  }
  pop() {
    if (!this.empty()) {
      return this.array.shift();
    }
  }
  push(item) {
    if (!this.full()) {
      this.array.push(item);
      return true;
    }
    return false;
  }
}

async function fetchPixivJson(url) {
  try {
    let res = await throttledFetch(url);
    if (!res.ok) {
      // Network or HTTP error — keep quiet in production (avoid showing errors to users).
      dbg(`Fetch pixiv json failed: ${res.status} ${res.statusText}`);
      return null;
    }
    let res_json = await res.json();
    if (res_json.error) {
      // API returned an error — log at debug level to avoid user-visible noise.
      dbg(`Pixiv API error: ${res_json.message}`);
      return null;
    }
    return res_json;
  } catch (e) {
    // Suppress noisy fetch errors (network down / proxy off). Rate-limit errors are thrown upstream.
    if (e?.message !== "PIXIV_RATE_LIMITED") {
      dbg(`Fetch pixiv json error:`, e);
    }
    return null;
  }
}

const IMAGE_FETCH_MAX_RETRIES = 3;



let baseUrl = "https://www.pixiv.net";
let illustInfoUrl = "/ajax/illust/";
let userProfileUrl = "/ajax/user/";
let searchUrl = "/ajax/search/illustrations/";
let rankingEndpoint = "https://www.pixiv.net/ranking.php";

const MIN_REQUEST_INTERVAL_MS = 1200;
const RATE_LIMIT_BACKOFF_MS = 15000;
const MAX_RATE_LIMIT_RETRIES = 3;
let nextAllowedRequestTime = 0;
let requestChain = Promise.resolve();
let debugLoggingEnabled = false;

function normalizeDetailType(rawType) {
  if (typeof rawType === "number") {
    if (rawType === 0) return "illust";
    if (rawType === 1) return "manga";
    if (rawType === 2) return "ugoira";
  }
  return rawType || null;
}

function dbg(...args) {
  if (debugLoggingEnabled) {
    console.debug(...args);
  }
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForRequestSlot() {
  const now = Date.now();
  if (now < nextAllowedRequestTime) {
    await delay(nextAllowedRequestTime - now);
  }
}

function throttledFetch(url, options = {}) {
  const run = () => executeThrottledFetch(url, options, 0);
  requestChain = requestChain.catch(() => { }).then(run);
  return requestChain;
}

async function executeThrottledFetch(url, options, attempt) {
  await waitForRequestSlot();
  try {
    const response = await fetch(url, options);
    if (response.status === 429) {
      nextAllowedRequestTime = Date.now() + RATE_LIMIT_BACKOFF_MS;
      if (attempt < MAX_RATE_LIMIT_RETRIES) {
        console.warn(`Pixiv rate limit hit (attempt ${attempt + 1}), backing off for ${RATE_LIMIT_BACKOFF_MS}ms`);
        return executeThrottledFetch(url, options, attempt + 1);
      }
      throw new Error("PIXIV_RATE_LIMITED");
    }
    nextAllowedRequestTime = Date.now() + MIN_REQUEST_INTERVAL_MS;
    return response;
  } catch (error) {
    if (error?.message === "PIXIV_RATE_LIMITED") {
      throw error;
    }
    if (attempt < MAX_RATE_LIMIT_RETRIES) {
      await delay(MIN_REQUEST_INTERVAL_MS);
      return executeThrottledFetch(url, options, attempt + 1);
    }
    throw error;
  }
}

const rankingModeMap = Object.freeze({
  [Order.ranking_daily]: { base: "daily", r18: "daily_r18" },
  [Order.ranking_weekly]: { base: "weekly", r18: "weekly_r18" },
  [Order.ranking_monthly]: { base: "monthly", r18: "monthly_r18" },
  [Order.ranking_rookie]: { base: "rookie", r18: "rookie_r18" },
  [Order.ranking_original]: { base: "original", r18: "original_r18" },
  [Order.artist]: { base: "artist", r18: "artist" },
  [Order.following]: { base: "following", r18: "following" },
  [Order.bookmarks]: { base: "bookmarks", r18: "bookmarks" },
  [Order.recommendations]: { base: "recommendations", r18: "recommendations" }
});

function resolveRankingMode(order, nsfwMode) {
  const config = rankingModeMap[order];
  if (!config) {
    return null;
  }
  if (nsfwMode === Mode.r18 && config.r18) {
    return config.r18;
  }
  return config.base;
}

const legacyOrders = new Set(["date_d", "date"]);
function normalizeOrder(order) {
  if (legacyOrders.has(order)) {
    return Order.ranking_daily;
  }
  return order;
}

function normalizeAiType(value) {
  if (value === 1 || value === "1") {
    return 1;
  }
  return null;
}

function applyConfigNormalization(config) {
  const updates = {};
  if (!Object.values(SMode).includes(config.s_mode)) {
    config.s_mode = SMode.s_tag;
    updates.s_mode = config.s_mode;
  }
  const normalizedOrder = normalizeOrder(config.order);
  if (normalizedOrder !== config.order) {
    config.order = normalizedOrder;
    updates.order = normalizedOrder;
  }
  const normalizedAiType = normalizeAiType(config.aiType);
  if (normalizedAiType !== config.aiType) {
    config.aiType = normalizedAiType;
    updates.aiType = normalizedAiType;
  }
  if (Object.keys(updates).length > 0) {
    browserAPI.storage.local.set(updates);
  }
  return config;
}

class SearchSource {
  constructor(config) {
    this.searchParam = config;
    this.params = ["order", "mode", "p", "s_mode", "type", "blt", "bgt"];
    this.totalPage = 0;
    this.itemsPerPage = 60;
    this.illustInfoPages = {};
    this.resetRankingState();
  }

  updateConfig(config) {
    this.searchParam = config;
    this.totalPage = 0;
    this.illustInfoPages = {};
    this.resetRankingState();
  }

  resetRankingState(dateOverride = null) {
    this.rankingMode = resolveRankingMode(this.searchParam.order, this.searchParam.mode);
    this.rankingPages = {};
    this.rankingTotalPage = 0;
    this.rankingDate = dateOverride;
    this.rankingPrevDate = null;
    this.allowRankingDateFallback = dateOverride === null;
  }

  replaceSpecialCharacter = (function () {
    var reg = /[!'()~]/g;
    var mapping = {
      "!": "%21",
      "'": "%27",
      "(": "%28",
      ")": "%29",
      "~": "%7E",
    };
    var map = function (e) {
      return mapping[e];
    };
    var fn = function (e) {
      return encodeURIComponent(e).replace(reg, map);
    };
    return fn;
  })();

  generateSearchUrl(p = 1) {
    let sp = this.searchParam;
    if (this.rankingMode) {
      // ranking requests use separate endpoint
      const params = new URLSearchParams({
        mode: this.rankingMode,
        format: "json",
        p: p.toString()
      });
      if (this.rankingDate) {
        params.set("date", this.rankingDate);
      }
      return params.toString();
    }
    sp.p = p;
    let word = buildKeywordQuery(sp.andKeywords, sp.orKeywords, sp.minusKeywords);
    let firstPart = encodeURIComponent(word);
    let secondPartArray = [];
    secondPartArray.push("?word=" + this.replaceSpecialCharacter(word));
    for (let o of this.params) {
      if (sp.hasOwnProperty(o) && sp[o]) {
        secondPartArray.push(`${o}=${sp[o]}`);
      }
    }
    let secondPart = secondPartArray.join("&");
    return firstPart + secondPart;
  }

  async searchIllustPage(p) {
    if (this.rankingMode) {
      let paramUrl = this.generateSearchUrl(p);
      let url = `${rankingEndpoint}?${paramUrl}`;
      let res = await throttledFetch(url);
      if (!res.ok) {
        dbg(`Fetch ranking json failed: ${res.status}`);
        return null;
      }
      let json = await res.json();
      return json;
    }
    let paramUrl = this.generateSearchUrl(p);
    let jsonResult = await fetchPixivJson(baseUrl + searchUrl + paramUrl);
    return jsonResult;
  }

  async getRandomIllust() {
    if (this.rankingMode === "artist") {
      return this.getRandomArtistIllust();
    }
    if (this.rankingMode === "following") {
      return this.getRandomFollowingIllust();
    }
    if (this.rankingMode === "bookmarks") {
      return this.getRandomBookmarkIllust();
    }
    if (this.rankingMode === "recommendations") {
      return this.getRandomRecommendationIllust();
    }
    if (this.rankingMode) {
      return this.getRandomRankingIllust();
    }
    return this.getRandomSearchIllust();
  }

  async getRandomFollowingIllust() {
    const userId = await getLoggedInUserId();
    if (!userId) {
      return this.handleLoginFailure();
    }

    const MAX_RETRIES = 5;
    for (let i = 0; i < MAX_RETRIES; i++) {
      try {
        // Fetch following list with random offset
        const offset = getRandomInt(0, 100); // Random offset to get variety
        const followingUrl = `${baseUrl}/ajax/user/${userId}/following?offset=${offset}&limit=24&rest=show`;
        const followingRes = await fetchPixivJson(followingUrl);
        
        if (!followingRes || !followingRes.body || !followingRes.body.users || followingRes.body.users.length === 0) {
          continue;
        }

        // Pick a random followed user
        const randomUser = followingRes.body.users[getRandomInt(0, followingRes.body.users.length)];
        if (!randomUser || !randomUser.userId) continue;

        // Fetch their profile to get illusts
        const profileUrl = `${baseUrl}${userProfileUrl}${randomUser.userId}/profile/all`;
        const profileRes = await fetchPixivJson(profileUrl);
        
        if (!profileRes || !profileRes.body || !profileRes.body.illusts) {
          continue;
        }

        const illustIds = Object.keys(profileRes.body.illusts);
        if (illustIds.length === 0) continue;

        // Pick random illust
        const randomIllustId = illustIds[getRandomInt(0, illustIds.length)];
        const detailUrl = `${baseUrl}${illustInfoUrl}${randomIllustId}`;
        const detail = await fetchPixivJson(detailUrl);
        
        if (!detail || !detail.body) continue;

        // Get user avatar
        const userAvatar = randomUser.profileImageUrl || null;
        const filtered = await this.buildResultFromDetail(detail.body, userAvatar);
        if (!filtered) continue;
        return filtered;

      } catch (e) {
        dbg("Error in getRandomFollowingIllust loop:", e);
        continue;
      }
    }
    return null;
  }

  async getRandomBookmarkIllust() {
    const userId = await getLoggedInUserId();
    if (!userId) {
      return this.handleLoginFailure();
    }

    const MAX_RETRIES = 5;
    for (let i = 0; i < MAX_RETRIES; i++) {
      try {
        // Fetch bookmarks with random offset
        const offset = getRandomInt(0, 200);
        const bookmarksUrl = `${baseUrl}/ajax/user/${userId}/illusts/bookmarks?tag=&offset=${offset}&limit=48&rest=show`;
        const bookmarksRes = await fetchPixivJson(bookmarksUrl);
        
        if (!bookmarksRes || !bookmarksRes.body || !bookmarksRes.body.works || bookmarksRes.body.works.length === 0) {
          continue;
        }

        // Pick a random bookmarked work
        const randomWork = bookmarksRes.body.works[getRandomInt(0, bookmarksRes.body.works.length)];
        if (!randomWork || !randomWork.id) continue;

        // Fetch detail
        const detailUrl = `${baseUrl}${illustInfoUrl}${randomWork.id}`;
        const detail = await fetchPixivJson(detailUrl);
        
        if (!detail || !detail.body) continue;

        // Get profile image from bookmark data
        const profileImg = randomWork.profileImageUrl || null;
        const filtered = await this.buildResultFromDetail(detail.body, profileImg);
        if (!filtered) continue;
        return filtered;

      } catch (e) {
        dbg("Error in getRandomBookmarkIllust loop:", e);
        continue;
      }
    }
    return null;
  }

  async getRandomRecommendationIllust() {
    const userId = await getLoggedInUserId();
    if (!userId) {
      return this.handleLoginFailure();
    }

    const MAX_RETRIES = 5;
    for (let i = 0; i < MAX_RETRIES; i++) {
      try {
        // Fetch recommendations
        const recommendUrl = `${baseUrl}/ajax/top/illust?mode=all&lang=en`;
        const recommendRes = await fetchPixivJson(recommendUrl);
        
        if (!recommendRes || !recommendRes.body) {
          continue;
        }

        // Recommendations can be in different fields
        let illusts = [];
        if (recommendRes.body.thumbnails && recommendRes.body.thumbnails.illust) {
          illusts = recommendRes.body.thumbnails.illust;
        } else if (recommendRes.body.page && recommendRes.body.page.recommend) {
          // Get IDs from recommend and look them up
          const ids = recommendRes.body.page.recommend.ids || [];
          if (ids.length > 0) {
            const randomId = ids[getRandomInt(0, ids.length)];
            const detailUrl = `${baseUrl}${illustInfoUrl}${randomId}`;
            const detail = await fetchPixivJson(detailUrl);
            if (detail && detail.body) {
              const filtered = await this.buildResultFromDetail(detail.body);
              if (filtered) return filtered;
            }
          }
          continue;
        }

        if (illusts.length === 0) continue;

        // Pick random illust
        const randomIllust = illusts[getRandomInt(0, illusts.length)];
        if (!randomIllust || !randomIllust.id) continue;

        const detailUrl = `${baseUrl}${illustInfoUrl}${randomIllust.id}`;
        const detail = await fetchPixivJson(detailUrl);
        
        if (!detail || !detail.body) continue;

        const filtered = await this.buildResultFromDetail(detail.body, randomIllust.profileImageUrl);
        if (!filtered) continue;
        return filtered;

      } catch (e) {
        dbg("Error in getRandomRecommendationIllust loop:", e);
        continue;
      }
    }
    return null;
  }

  async handleLoginFailure() {
    // Use user-configured fallback mode when login is required but user is not logged in
    const fallbackMode = this.searchParam.loginFallbackMode || 'ranking_daily';
    const fallbackRankingMode = resolveRankingMode(fallbackMode, this.searchParam.mode);
    dbg(`Login required but not logged in, falling back to ${fallbackMode}`);
    const originalMode = this.rankingMode;
    this.rankingMode = fallbackRankingMode || 'daily';
    const result = await this.getRandomRankingIllust();
    this.rankingMode = originalMode; // Restore original mode
    return result;
  }

  async getRandomArtistIllust() {
    const artistIdsStr = this.searchParam.artistId;
    if (!artistIdsStr) {
      return null;
    }
    // Split by comma, trim whitespace, remove empty strings
    const artistIds = artistIdsStr.split(',').map(s => s.trim()).filter(s => s);
    if (artistIds.length === 0) {
      return null;
    }

    const MAX_RETRIES = 5;
    for (let i = 0; i < MAX_RETRIES; i++) {
        try {
            // 1. Pick a random artist ID
            const randomArtistId = artistIds[getRandomInt(0, artistIds.length)];
            
            // 2. Fetch user profile to get list of work IDs AND user basic info (for avatar)
            // URL: /ajax/user/{id}/profile/all
            const profileUrl = `${baseUrl}${userProfileUrl}${randomArtistId}/profile/all`;
            const userDataUrl = `${baseUrl}/ajax/user/${randomArtistId}?full=1`;
            
            const [profileRes, userDataRes] = await Promise.all([
                fetchPixivJson(profileUrl),
                fetchPixivJson(userDataUrl)
            ]);
            
            if (!profileRes || !profileRes.body || !profileRes.body.illusts) {
                // If artist not found or has no illusts
                continue;
            }

            let artistAvatar = null;
            if (userDataRes && userDataRes.body) {
                artistAvatar = userDataRes.body.image || userDataRes.body.imageBig;
            }

            const illustsMap = profileRes.body.illusts;
            const illustIds = Object.keys(illustsMap);
            
            if (illustIds.length === 0) {
                continue;
            }

            // 3. Pick random illust ID
            const randomIllustId = illustIds[getRandomInt(0, illustIds.length)];

            // 4. Fetch detail
            const detailUrl = `${baseUrl}${illustInfoUrl}${randomIllustId}`;
            const detail = await fetchPixivJson(detailUrl);
            
            if (!detail || !detail.body) {
                continue;
            }

            // 5. Build result
            // We might want to pass profile image from somewhere if available, but detail.body usually has it?
            // Actually detail.body has user info.
            // Note: We are not enforcing "passesDetailFilters" strictly here except maybe for R18/Safe mode?
            // The user chose a specific artist, so maybe they want to see everything?
            // But 'mode' (safe/r18) preference is global. So we should probably respect it.
            
            const filtered = await this.buildResultFromDetail(detail.body, artistAvatar);
            if (!filtered) {
                 // Maybe this artwork was filtered out (e.g. R18 when in Safe mode)
                 // Continue loop to find another valid one
                continue;
            }
            return filtered;

        } catch (e) {
            dbg("Error in getRandomArtistIllust loop:", e);
            continue;
        }
    }
    return null;
  }

  async getRandomSearchIllust() {
    const MAX_RETRIES = 5;
    for (let i = 0; i < MAX_RETRIES; i++) {
      try {
        if (this.totalPage === 0) {
          let firstPage = await this.searchIllustPage(1);
          if (!firstPage || !firstPage.body) continue;
          let total = firstPage.body.illust.total;
          this.totalPage = Math.ceil(total / this.itemsPerPage);
          if (this.totalPage === 0) return null;
        }

        let randomPage = getRandomInt(0, this.totalPage) + 1;
        if (!this.illustInfoPages[randomPage]) {
          let pageObj = await this.searchIllustPage(randomPage);
          if (!pageObj || !pageObj.body) continue;

          let total = pageObj.body.illust.total;
          let tp = Math.ceil(total / this.itemsPerPage);
          if (tp > this.totalPage) {
            this.totalPage = tp;
          }

          // filter images
          pageObj.body.illust.data = pageObj.body.illust.data.filter(
            (el) => {
              let aiOk = !this.searchParam.aiType || el.aiType == this.searchParam.aiType;
              let widthOk = !this.searchParam.minWidthPx || (el.width && el.width >= this.searchParam.minWidthPx);
              let heightOk = !this.searchParam.minHeightPx || (el.height && el.height >= this.searchParam.minHeightPx);
              return aiOk && widthOk && heightOk;
            }
          );
          this.illustInfoPages[randomPage] = pageObj.body.illust.data;
        }

        let illustArray = this.illustInfoPages[randomPage];
        if (!illustArray || illustArray.length === 0) continue;

        let randomIndex = getRandomInt(0, illustArray.length);
        let searchEntry = illustArray[randomIndex];
        let detail = await fetchPixivJson(baseUrl + illustInfoUrl + searchEntry.id);
        if (!detail || !detail.body) continue;
        let filtered = await this.buildResultFromDetail(detail.body, searchEntry.profileImageUrl);
        if (!filtered) continue;
        return filtered;
      } catch (e) {
        dbg("Error in getRandomIllust loop:", e);
        continue;
      }
    }
    return null;
  }

  async getRandomRankingIllust() {
    const MAX_RETRIES = 8;
    for (let i = 0; i < MAX_RETRIES; i++) {
      try {
        if (!this.rankingTotalPage) {
          // trigger initial load
          await this.loadRankingPage(1);
          if (!this.rankingTotalPage) {
            if (await this.tryRankingFallback()) { continue; }
            return null;
          }
        }

        let randomPage = getRandomInt(1, this.rankingTotalPage + 1);
        let pageData = await this.loadRankingPage(randomPage);
        if (!pageData || pageData.length === 0) {
          if (await this.tryRankingFallback()) { continue; }
          continue;
        }

        let randomIndex = getRandomInt(0, pageData.length);
        let rankingEntry = pageData[randomIndex];
        if (!rankingEntry) continue;

        let detail = await fetchPixivJson(baseUrl + illustInfoUrl + rankingEntry.illust_id);
        if (!detail || !detail.body) continue;

        let filtered = await this.buildResultFromDetail(detail.body, rankingEntry.profile_img);
        if (!filtered) continue;
        return filtered;
      } catch (e) {
        dbg("Error in getRandomRankingIllust loop:", e);
        continue;
      }
    }
    if (await this.tryRankingFallback()) {
      return this.getRandomRankingIllust();
    }
    return null;
  }

  async loadRankingPage(page) {
    if (!this.rankingMode) {
      return null;
    }
    if (this.rankingPages[page]) {
      return this.rankingPages[page];
    }
    const params = new URLSearchParams({
      mode: this.rankingMode,
      format: "json",
      p: page.toString()
    });
    if (this.rankingDate) {
      params.set("date", this.rankingDate);
    }
    try {
      let res = await throttledFetch(`${rankingEndpoint}?${params.toString()}`);
      if (!res.ok) {
        dbg(`Ranking fetch failed: ${res.status} ${res.statusText}`);
        return null;
      }
      let json = await res.json();
      if (!json || !json.contents) {
        console.warn("Ranking response missing contents");
        return null;
      }
      if (!this.rankingDate) {
        this.rankingDate = json.date;
      }
      this.rankingPrevDate = json.prev_date || null;
      let perPage = json.contents.length || 50;
      if (!this.rankingTotalPage) {
        if (json.rank_total && perPage) {
          this.rankingTotalPage = Math.max(1, Math.ceil(json.rank_total / perPage));
        } else {
          this.rankingTotalPage = Math.max(page, 1);
        }
      }
      const filteredContents = json.contents.filter((entry) => {
        let widthOk = !this.searchParam.minWidthPx || (entry.width && entry.width >= this.searchParam.minWidthPx);
        let heightOk = !this.searchParam.minHeightPx || (entry.height && entry.height >= this.searchParam.minHeightPx);
        return widthOk && heightOk;
      });
      this.rankingPages[page] = filteredContents;
      return this.rankingPages[page];
    } catch (e) {
      dbg("Ranking fetch error", e);
      return null;
    }
  }

  async tryRankingFallback() {
    if (this.allowRankingDateFallback && this.rankingPrevDate) {
      console.warn(`Ranking results exhausted, falling back to previous date ${this.rankingPrevDate}`);
      this.resetRankingState(this.rankingPrevDate);
      return true;
    }
    return false;
  }

  matchesMode(detail) {
    if (!this.searchParam.mode || this.searchParam.mode === "all") {
      return true;
    }
    if (this.searchParam.mode === "safe") {
      return detail.xRestrict === 0;
    }
    if (this.searchParam.mode === "r18") {
      return detail.xRestrict === 1;
    }
    return true;
  }

  matchesType(detail) {
    const type = this.searchParam.type;
    if (!type || type === "all") {
      return true;
    }
    const detailType = normalizeDetailType(detail.illustType || detail.type);
    if (!detailType) {
      return true;
    }
    if (type === "illust_and_ugoira") {
      return detailType === "illust" || detailType === "ugoira";
    }
    return detailType === type;
  }

  async fetchUgoiraMetadata(illustId) {
    try {
      const metaUrl = `${baseUrl}${illustInfoUrl}${illustId}/ugoira_meta`;
      const meta = await fetchPixivJson(metaUrl);
      return meta?.body || null;
    } catch (e) {
      dbg("Fetch ugoira metadata error", e);
      return null;
    }
  }

  passesDetailFilters(detail) {
    // ... (unchanged)
    let sp = this.searchParam;
    if (sp.aiType && detail.aiType !== undefined && detail.aiType !== null && Number(detail.aiType) !== Number(sp.aiType)) {
      return false;
    }
    if (sp.blt !== null && sp.blt !== undefined) {
      let count = detail.bookmarkCount ?? detail.bookmarkCountPublic ?? null;
      if (count !== null && count < sp.blt) {
        return false;
      }
    }
    if (sp.bgt !== null && sp.bgt !== undefined) {
      let count = detail.bookmarkCount ?? detail.bookmarkCountPublic ?? null;
      if (count !== null && count > sp.bgt) {
        return false;
      }
    }
    if (!this.matchesMode(detail)) {
      return false;
    }
    if (!this.matchesType(detail)) {
      return false;
    }
    if (sp.minWidthPx !== null && sp.minWidthPx !== undefined) {
      if (!detail.width || detail.width < sp.minWidthPx) {
        return false;
      }
    }
    if (sp.minHeightPx !== null && sp.minHeightPx !== undefined) {
      if (!detail.height || detail.height < sp.minHeightPx) {
        return false;
      }
    }
    return true;
  }

  async buildResultFromDetail(detail, fallbackProfileUrl = null) {
    if (!this.passesDetailFilters(detail)) {
      return null;
    }
    const detailType = normalizeDetailType(detail.illustType || detail.type);
    
    let ugoiraMeta = null;
    if (detailType === "ugoira") {
      ugoiraMeta = await this.fetchUgoiraMetadata(detail.illustId);
    }
    let profileUrl = fallbackProfileUrl || detail.userIllusts?.[detail.illustId]?.url || detail.profileImageUrl || null;
    // Use regular resolution for best quality (parallel fetch optimization still applies)
    let imageUrl = detail.urls?.regular || detail.urls?.small || detail.urls?.thumb;
    if (!imageUrl) {
      return null;
    }
    // Fetch main image and profile image in parallel for faster loading
    const [imgBlob, profileBlob] = await Promise.all([
      fetchImage(imageUrl),
      profileUrl ? fetchImage(profileUrl) : Promise.resolve(null)
    ]);
    if (!imgBlob) {
      return null;
    }
    let result = {
      userName: detail.userName,
      userId: detail.userId,
      userIdUrl: baseUrl + "/users/" + detail.userId,
      illustId: detail.illustId,
      illustIdUrl: baseUrl + "/artworks/" + detail.illustId,
      title: detail.title,
      imageObjectUrl: await blobToDataUrl(imgBlob),
      profileImageUrl: null
    };
    if (profileBlob) {
      try {
        result.profileImageUrl = await blobToDataUrl(profileBlob);
      } catch (e) {
        console.warn("Unable to convert profile image", e);
      }
    } else if (profileUrl) {
      result.profileImageUrl = profileUrl;
    }
    if (ugoiraMeta && ugoiraMeta.frames && ugoiraMeta.frames.length) {
      const zipUrl = ugoiraMeta.originalSrc || ugoiraMeta.src || ugoiraMeta.zip_urls?.medium || null;
      if (zipUrl) {
        result.ugoira = {
          zipUrl,
          mimeType: ugoiraMeta.mime_type || "image/jpeg",
          frames: ugoiraMeta.frames.map((frame) => ({ file: frame.file, delay: frame.delay }))
        };
      }
    }
    if (!result.profileImageUrl) {
      result.profileImageUrl = "";
    }
    return result;
  }
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    let reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// Check Pixiv login status via cookies
async function checkPixivLogin() {
  try {
    const cookie = await browserAPI.cookies.get({
      url: 'https://www.pixiv.net',
      name: 'PHPSESSID'
    });
    
    if (cookie && cookie.value) {
      // Try to extract user ID from the session - format is typically "userId_sessionHash"
      const parts = cookie.value.split('_');
      const userId = parts[0] && /^\d+$/.test(parts[0]) ? parts[0] : null;
      
      // Try to fetch user nickname
      let userName = null;
      if (userId) {
        try {
          const userDataUrl = `${baseUrl}/ajax/user/${userId}?full=0`;
          const userRes = await fetchPixivJson(userDataUrl);
          if (userRes && userRes.body && userRes.body.name) {
            userName = userRes.body.name;
          }
        } catch (e) {
          dbg('Error fetching user name:', e);
        }
      }
      
      return { loggedIn: true, userId, userName };
    }
    return { loggedIn: false };
  } catch (e) {
    dbg('Error checking Pixiv login:', e);
    return { loggedIn: false };
  }
}

// Get logged-in user ID
async function getLoggedInUserId() {
  const status = await checkPixivLogin();
  return status.loggedIn ? status.userId : null;
}

let searchSource;
let artworkQueue;
let running = 0;
let configVersion = 0;

const MessageChannel = Object.freeze({
  requestArtwork: "requestArtwork",
  refreshPreferences: "refreshPreferences",
  checkPixivLogin: "checkPixivLogin",
  fetchUgoiraZip: "fetchUgoiraZip"
});

const legacyActionMap = new Map([
  ["fetchImage", MessageChannel.requestArtwork],
  ["updateConfig", MessageChannel.refreshPreferences],
  ["fetchUgoiraZip", MessageChannel.fetchUgoiraZip]
]);

const MAX_CONCURRENT_DOWNLOADS = 4;
let activeDownloads = 0;
const downloadQueue = [];

async function downloadFetch(url, options = {}, responseProcessor = null) {
  if (activeDownloads >= MAX_CONCURRENT_DOWNLOADS) {
    await new Promise(resolve => downloadQueue.push(resolve));
  }
  activeDownloads++;
  try {
    const res = await fetch(url, options);
    if (responseProcessor) {
      return await responseProcessor(res);
    }
    return res;
  } finally {
    activeDownloads--;
    if (downloadQueue.length > 0) {
      downloadQueue.shift()();
    }
  }
}

async function fetchImage(url, attempt = 0) {
  try {
    // Pass a processor to hold the lock until the blob is fully downloaded
    const blob = await downloadFetch(url, {}, async (res) => {
      if (!res.ok) {
        throw new Error(`IMAGE_STATUS_${res.status}`);
      }
      return await res.blob();
    });
    return blob;
  } catch (e) {
    if (attempt < 5) { // Fixed constant for now or use global const if defined
      const backoff = Math.min(2000 * (attempt + 1), 6000);
      await delay(backoff);
      return fetchImage(url, attempt + 1);
    }
    if (e?.message !== "PIXIV_RATE_LIMITED") {
      console.warn(`Fetch image error after retries:`, e);
    }
    return null;
  }
}

function fillQueue() {
  const CONCURRENT_FILLS = 3; // aggressively fill queue
  while (running < CONCURRENT_FILLS && !artworkQueue.full()) {
    ++running;
    setTimeout(async () => {
      const localVersion = configVersion;
      if (artworkQueue.full()) { return; }
      let res = await searchSource.getRandomIllust();
      
      // If config changed while we were fetching (version mismatch), discard this result
      if (localVersion !== configVersion) {
        console.log(`Discarding stale result (v${localVersion} vs v${configVersion})`);
        --running;
        fillQueue(); // Trigger refill with new config
        return;
      }
      
      if (res) {
        artworkQueue.push(res);
        storageSessionSet({
          artworkQueueCache: artworkQueue,
          illustQueue: artworkQueue
        });
      }
      --running;
    }, 0);
  }
}

async function reloadConfig() {
  configVersion++;
  let config = await loadPreferences();
  config = applyConfigNormalization(config);
  if (searchSource) {
    searchSource.updateConfig(config);
  } else {
    searchSource = new SearchSource(config);
  }
  debugLoggingEnabled = !!config.debugLogging;
  
  // WIPE existing queue to force new config usage
  artworkQueue = new ArtworkQueue(8); // Increased buffer size
  storageSessionSet({
    artworkQueueCache: artworkQueue,
    illustQueue: artworkQueue
  });
  fillQueue();
  dbg("Config reloaded and queue reset via reloadConfig");
}

browserAPI.storage.onChanged.addListener((changes, area) => {
  if (area === 'local') {
    reloadConfig();
  }
});

async function start() {
  // Initial load logic preserves cache if valid
  let config = await loadPreferences();
  config = applyConfigNormalization(config);
  debugLoggingEnabled = !!config.debugLogging;
  searchSource = new SearchSource(config);
  const queueCache = await storageSessionGet({
    artworkQueueCache: null,
    illustQueue: null
  });
  const restoredQueue = queueCache.artworkQueueCache || queueCache.illustQueue || null;
  if (!restoredQueue) {
    artworkQueue = new ArtworkQueue(8); // Increased buffer size
  } else {
    artworkQueue = Object.setPrototypeOf(restoredQueue, ArtworkQueue.prototype);
    // Upgrade capacity if needed (though existing queue will keep its buffer until popped)
    artworkQueue.maxsize = 8; 
  }

  fillQueue();
  console.log("background script loaded");
}

let initPromise = start();

browserAPI.runtime.onMessage.addListener(function (
  message,
  sender,
  sendResponse
) {
  (
    async () => {
      await initPromise;
      const action = legacyActionMap.get(message.action) || message.action;
      if (action === MessageChannel.requestArtwork) {
        let res = artworkQueue.pop();
        if (!res) {
          res = await searchSource.getRandomIllust();
        }
        if (res) {
          sendResponse(res);
          let { profileImageUrl, imageObjectUrl, ...filteredRes } = res;
          console.log(filteredRes);
          browserAPI.runtime.sendMessage({ action: 'artworkLoadSucceeded' })
            .catch(e => {
              if (e && e.message && e.message.includes('Could not establish connection')) {
                // 静默忽略 Manifest V3 service worker 休眠导致的错误
              } else {
                dbg('Background sendMessage error:', e);
              }
            });
        } else {
          browserAPI.runtime.sendMessage({ action: 'artworkLoadFailed' })
            .catch(e => {
              if (e && e.message && e.message.includes('Could not establish connection')) {
                // 静默忽略 Manifest V3 service worker 休眠导致的错误
              } else {
                dbg('Background sendMessage error:', e);
              }
            });
          sendResponse(null);
        }
        fillQueue();
      } else if (action === MessageChannel.refreshPreferences) {
        await reloadConfig();
        sendResponse();
      } else if (action === MessageChannel.checkPixivLogin) {
        const status = await checkPixivLogin();
        sendResponse(status);
      } else if (action === MessageChannel.fetchUgoiraZip) {
        const url = message.url;
        if (!url) {
          sendResponse(null);
          return;
        }
        let sent = false;
        try {
          const blob = await fetchImage(url);
          if (blob) {
            const dataUrl = await blobToDataUrl(blob);
            sendResponse(dataUrl);
            sent = true;
          } else {
            // Log specifically if null returned (retries failed)
            console.warn("fetchImage returned null for Ugoira URL:", url);
          }
        } catch (e) {
          console.warn("Fetch Ugoira Zip failed exception:", e);
        } finally {
          if (!sent) {
            try { sendResponse(null); } catch (e) {} 
          }
        }
      } else {
        // 其他分支，确保 sendResponse 被调用
        sendResponse();
      }
    }
  )();
  return true;
});
