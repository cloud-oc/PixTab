# PixTab <img src="icons/icon-128.png" width="36" height="36" align="right" alt="icon">

<a href="https://github.com/cloud-oc/PixTab/blob/main/README.md"><img src="https://img.shields.io/badge/English-blue?style=for-the-badge" alt="English"></a> <a href="https://github.com/cloud-oc/PixTab/blob/main/README.zh-CN.md"><img src="https://img.shields.io/badge/简体中文-red?style=for-the-badge" alt="简体中文"></a> <a href="https://github.com/cloud-oc/PixTab/blob/main/README.zh-TW.md"><img src="https://img.shields.io/badge/繁體中文-orange?style=for-the-badge" alt="繁體中文"></a> <a href="https://github.com/cloud-oc/PixTab/blob/main/README.ja.md"><img src="https://img.shields.io/badge/日本語-green?style=for-the-badge" alt="日本語"></a>

在瀏覽器的新分頁顯示 Pixiv 精選插畫。

## 簡介

PixTab 是一款輕量級的瀏覽器擴充功能，可在新分頁顯示來自 Pixiv 的作品，支援自訂設定、關鍵字搜尋與本地化設定，同時支援 Chromium 與 Firefox 內核的瀏覽器。

## 主要功能

- **精美 Pixiv 插畫** — 每次打開新分頁都能欣賞 Pixiv 上的作品。
- **多種排序方式** — 支援每日/每週/每月排行榜、新人榜、原創榜、人氣榜等。
- **關鍵字搜尋** — 支援 AND、OR、NOT 組合關鍵字，按標籤精準篩選作品。
- **收藏數篩選** — 設定最低/最高收藏數範圍，依收藏數篩選作品。
- **作品類型過濾** — 可選插畫、漫畫、動圖，或僅看非 AI 生成作品。
- **解析度要求** — 設定最小寬高，確保圖片清晰度。
- **顯示樣式** — 自訂圖片尺寸、對齊方式與平鋪模式。
- **淺色 & 深色主題** — 介面主題會隨系統時間自動切換。
- **多語言支援** — 提供 英語、簡體中文、繁體中文、日語、韓語 五種介面語言。
- **隱私友好** — 所有設定保存在本地，不會傳送任何資料到外部伺服器。

## 安裝方法

> **注意**：本擴充暫未上架 Chrome Web Store 與 Firefox Add-ons，請按照以下步驟手動安裝。

### Chromium 內核瀏覽器

1. 克隆或下載本倉庫。
2. 在瀏覽器中打開 `chrome://extensions`。
3. 啟用 **開發人員模式（Developer mode）**。
4. 方案 A — 使用打包檔（較為便捷）：
	- 若你從 Releases 下載了 `dist/` 下的打包檔（例如 `dist/pixtab-0.9-chrome.zip`），部分 Chromium 瀏覽器支援將該 `.zip` 檔直接拖曳到 `chrome://extensions` 頁面進行安裝。若拖曳成功，擴充將直接安裝並可使用。
	- 若你的瀏覽器不支援直接拖曳安裝，請先解壓 `.zip`，然後使用 **載入已解壓的擴充程式（Load unpacked）** 選取解壓後的資料夾進行安裝。

5. 方案 B — 從原始碼安裝（開發者模式）：
	- 點選 **載入已解壓的擴充程式（Load unpacked）**，並選取本專案資料夾。

6. 開啟新分頁，即可體驗 PixTab！

### Firefox 內核瀏覽器（113+）

1. 克隆或下載本倉庫。
2. 在瀏覽器中打開 `about:debugging#/runtime/this-firefox`。
3. 點選 **臨時載入附加元件（Load Temporary Add-on）**。
4. 方案 A — 使用打包的 XPI（便於測試）：
	- 若你下載了 `dist/*.xpi`（例如 `dist/pixtab-0.9-firefox.xpi`），可以打開 `about:addons`，透過齒輪選單選擇 **從檔案安裝附加元件（Install Add-on From File...）**，或將 `.xpi` 檔拖曳到擴充管理頁來安裝。

5. 方案 B — 臨時載入（開發者）：
	- 點選 **臨時載入附加元件（Load Temporary Add-on）**，並選取本專案資料夾中的 `manifest.json` 檔案。

6. 開啟新分頁，即可體驗 PixTab！

> **提示**：Firefox 臨時載入的擴充在瀏覽器重啟後會失效，需要重新載入。

## 網路需求

本擴充需要可正常訪問 Pixiv（`pixiv.net` 與 `pximg.net`）。如果新分頁一直停留在載入動畫，表示當前網路無法訪問 Pixiv，請自行解決網路問題。本擴充不提供任何代理功能。

## 授權

詳見 [LICENSE](LICENSE) 檔案。

## 致謝

本專案靈感來源：

- [HumbleNewTabPage](https://github.com/ibillingsley/HumbleNewTabPage)
- [PixivforMuzei3](https://github.com/yellowbluesky/PixivforMuzei3)

