import { Mode, Order, SMode } from "../shared/preferences.js";
import { buildKeywordQuery } from "../shared/keyword-builder.js";
import { loadPreferences } from "../shared/storage.js";

chrome.runtime.onInstalled.addListener((details) => {
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
      "condition": {
        initiatorDomains: [chrome.runtime.id],
        "urlFilter": "pixiv.net",
        "resourceTypes": [
          "xmlhttprequest",
        ]
      }
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
      "condition": {
        initiatorDomains: [chrome.runtime.id],
        "urlFilter": "pximg.net",
        "resourceTypes": [
          "xmlhttprequest",
        ]
      }
    }
  ];
  chrome.declarativeNetRequest.updateDynamicRules({
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
      console.error(`Fetch pixiv json failed: ${res.status} ${res.statusText}`);
      return null;
    }
    let res_json = await res.json();
    if (res_json.error) {
      console.error(`Pixiv API error: ${res_json.message}`);
      return null;
    }
    return res_json;
  } catch (e) {
    if (e?.message !== "PIXIV_RATE_LIMITED") {
      console.error(`Fetch pixiv json error:`, e);
    }
    return null;
  }
}

const IMAGE_FETCH_MAX_RETRIES = 3;

async function fetchImage(url, attempt = 0) {
  try {
    let res = await throttledFetch(url);
    if (!res.ok) {
      throw new Error(`IMAGE_STATUS_${res.status}`);
    }
    return await res.blob();
  } catch (e) {
    if (attempt < IMAGE_FETCH_MAX_RETRIES) {
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

let baseUrl = "https://www.pixiv.net";
let illustInfoUrl = "/ajax/illust/";
let searchUrl = "/ajax/search/illustrations/";
let rankingEndpoint = "https://www.pixiv.net/ranking.php";

const MIN_REQUEST_INTERVAL_MS = 1200;
const RATE_LIMIT_BACKOFF_MS = 15000;
const MAX_RATE_LIMIT_RETRIES = 3;
let nextAllowedRequestTime = 0;
let requestChain = Promise.resolve();

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
  [Order.ranking_original]: { base: "original", r18: "original_r18" }
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
    chrome.storage.local.set(updates);
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
      let res = await throttledFetch(url, {
        headers: { "referer": baseUrl }
      });
      if (!res.ok) {
        console.error(`Fetch ranking json failed: ${res.status}`);
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
    if (this.rankingMode) {
      return this.getRandomRankingIllust();
    }
    return this.getRandomSearchIllust();
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
        console.error("Error in getRandomIllust loop:", e);
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
        console.error("Error in getRandomRankingIllust loop:", e);
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
      let res = await throttledFetch(`${rankingEndpoint}?${params.toString()}`, {
        headers: { "referer": baseUrl }
      });
      if (!res.ok) {
        console.error(`Ranking fetch failed: ${res.status} ${res.statusText}`);
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
      console.error("Ranking fetch error", e);
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
    const detailType = detail.illustType || detail.type;
    if (!detailType) {
      return true;
    }
    if (type === "illust_and_ugoira") {
      return detailType === "illust" || detailType === "ugoira";
    }
    return detailType === type;
  }

  passesDetailFilters(detail) {
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
    let profileUrl = fallbackProfileUrl || detail.userIllusts?.[detail.illustId]?.url || detail.profileImageUrl || null;
    let imageUrl = detail.urls?.regular || detail.urls?.small || detail.urls?.thumb;
    if (!imageUrl) {
      return null;
    }
    let imgBlob = await fetchImage(imageUrl);
    if (!imgBlob) {
      return null;
    }
    let profileBlob = null;
    if (profileUrl) {
      profileBlob = await fetchImage(profileUrl);
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

let searchSource;
let artworkQueue;
let running = 0;

const MessageChannel = Object.freeze({
  requestArtwork: "requestArtwork",
  refreshPreferences: "refreshPreferences"
});

const legacyActionMap = new Map([
  ["fetchImage", MessageChannel.requestArtwork],
  ["updateConfig", MessageChannel.refreshPreferences]
]);

function fillQueue() {
  while (running < artworkQueue.capacity() - artworkQueue.size()) {
    ++running;
    setTimeout(async () => {
      if (artworkQueue.full()) { return; }
      let res = await searchSource.getRandomIllust();
      if (res) {
        artworkQueue.push(res);
        chrome.storage.session.set({
          artworkQueueCache: artworkQueue,
          illustQueue: artworkQueue
        });
      }
      --running;
    }, 0);
  }
}

async function start() {
  let config = await loadPreferences();
  config = applyConfigNormalization(config);
  searchSource = new SearchSource(config);
  const queueCache = await chrome.storage.session.get({
    artworkQueueCache: null,
    illustQueue: null
  });
  const restoredQueue = queueCache.artworkQueueCache || queueCache.illustQueue || null;
  if (!restoredQueue) {
    artworkQueue = new ArtworkQueue(2);
  } else {
    artworkQueue = Object.setPrototypeOf(restoredQueue, ArtworkQueue.prototype);
  }

  fillQueue();
  console.log("background script loaded");
}

let initPromise = start();

chrome.runtime.onMessage.addListener(function (
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
        } else {
          sendResponse(null);
        }
        fillQueue();
      } else if (action === MessageChannel.refreshPreferences) {
        let config = await loadPreferences();
        config = applyConfigNormalization(config);
        searchSource.updateConfig(config);
        artworkQueue = new ArtworkQueue(2);
        chrome.storage.session.set({
          artworkQueueCache: artworkQueue,
          illustQueue: artworkQueue
        });
        fillQueue();
      }
    }
  )();
  return true;
});
