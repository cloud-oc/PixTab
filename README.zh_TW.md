<div align="center">
  <p>
    <a href="https://github.com/cloud-oc/PixTab/blob/main/README.md"><img src="https://img.shields.io/badge/English-555555?style=flat-square" alt="English"></a>
    <a href="https://github.com/cloud-oc/PixTab/blob/main/README.zh_CN.md"><img src="https://img.shields.io/badge/简体中文-D0021B?style=flat-square" alt="简体中文"></a>
    <a href="https://github.com/cloud-oc/PixTab/blob/main/README.zh_TW.md"><img src="https://img.shields.io/badge/繁體中文-E67E22?style=flat-square" alt="繁體中文"></a>
    <a href="https://github.com/cloud-oc/PixTab/blob/main/README.ja.md"><img src="https://img.shields.io/badge/日本語-F48FB1?style=flat-square" alt="日本語"></a>
    <a href="https://github.com/cloud-oc/PixTab/blob/main/README.ko.md"><img src="https://img.shields.io/badge/한국어-03C75A?style=flat-square" alt="한국어"></a>
    <a href="https://github.com/cloud-oc/PixTab/blob/main/README.ru.md"><img src="https://img.shields.io/badge/Русский-0057B8?style=flat-square" alt="Русский"></a>
  </p>
</div>

<hr>

<div align="center">
  <img src="icons/icon-128.png" width="100" height="100" alt="PixTab Icon">
  <br>
  <b style="font-size: 36px;">PixTab</b>
  <p>
    <strong>◎ 讓 Pixiv 上的插畫成為你的瀏覽器新分頁！◎</strong>
  </p>

  <p>
    <a href="https://microsoftedge.microsoft.com/addons/detail/chpabpanagjfnglcpnpdpelacjfpnfoj" style="text-decoration:none;">
      <img src="https://raw.githubusercontent.com/alrra/browser-logos/90fdf03c/src/edge/edge_48x48.png" width="24" height="24" alt="Edge" style="vertical-align: middle; margin-bottom: 2px;"> Edge
    </a>
    &nbsp;&nbsp;&nbsp;
    <a href="https://addons.mozilla.org/firefox/addon/pixtab/" style="text-decoration:none;">
      <img src="https://raw.githubusercontent.com/alrra/browser-logos/90fdf03c/src/firefox/firefox_48x48.png" width="24" height="24" alt="Firefox" style="vertical-align: middle; margin-bottom: 2px;"> Firefox
    </a>
  </p>
</div>

<br>

## 📖 簡介

**PixTab** 是一款輕量級、高顏值的瀏覽器擴充功能，它能讓你每次打開新分頁時都欣賞到來自 Pixiv 的精選插畫。支援自訂配置、關鍵字搜尋、本地化，並且完美支援 Chromium 和 Firefox 系列瀏覽器。(✿◡‿◡)

## ✨ 主要功能

- 🎨 **精美插畫** — 每次打開新分頁，邂逅高質量的 Pixiv 畫作。
- 📊 **多榜單支援** — 日榜、週榜、月榜、新人榜、原創榜、受男性/女性歡迎榜等！
- 🔍 **關鍵字搜尋** — 支援 AND、OR、NOT 組合查詢，精準定位你的喜好。
- 🔖 **收藏數過濾** — 設定最小/最大收藏數，只看熱門作品。
- 🖼️ **類型篩選** — 選擇插畫、漫畫、動圖 (Ugoira)，或屏蔽 AI 生成作品。
- 📏 **畫質控制** — 設定最小寬/高，拒絕模糊圖。
- 🛠️ **個性化定製** — 自由調整圖片大小、對齊方式和平鋪模式。
- 🌓 **主題同步** — 介面主題隨系統時間自動切換深色/淺色模式。
- 🌍 **多語言支援** — 提供簡體中文、繁體中文、英語、日語、韓語、俄語。
- 🛡️ **隱私優先** — 所有設定僅保存在本地，絕不向外部伺服器上傳任何數據。

## 📦 離線安裝

> **注意**：本擴充功能未上架 Chrome 應用商店。Chrome 用戶請按照以下步驟手動安裝。

<details>
<summary><strong>📥 Chromium 核心瀏覽器 (Chrome, Edge, Brave...)</strong></summary>

1. 克隆或下載本倉庫。
2. 在瀏覽器網址列輸入 `chrome://extensions` 並打開。
3. 開啟右上角的 **開發者模式** (Developer mode)。
4. **方法 A — 安裝打包好的 ZIP (推薦):**
    - 如果你下載了 `dist/` 目錄下的發布包 (如 `dist/pixtab-0.9-chrome.zip`)，嘗試直接將 `.zip` 文件拖入擴充功能管理頁面。
    - 如果拖拽無效，請解壓該壓縮包，然後點擊 **載入已解壓的擴充功能** (Load unpacked)，選擇解壓後的文件夾。
5. **方法 B — 源碼安裝 (開發者):**
    - 點擊 **載入已解壓的擴充功能**，直接選擇項目根目錄。
6. 打開新分頁，開始體驗吧！✨
</details>

<details>
<summary><strong>🦊 Firefox 核心瀏覽器 (140+)</strong></summary>

1. 克隆或下載本倉庫。
2. 使用 Firefox 140 或更高版本，訪問 `about:debugging#/runtime/this-firefox`。
3. 點擊 **臨時載入附加元件...** (Load Temporary Add-on)。
4. **方法 A — 安裝 XPI 包 (測試用):**
    - 如果你下載了 `dist/*.xpi` (如 `dist/pixtab-0.9-firefox.xpi`)，打開 `about:addons`，點擊齒輪圖標 ⚙️ → **從文件安裝附加元件...**，或直接將 `.xpi` 文件拖入頁面。
5. **方法 B — 臨時載入 (開發者):**
    - 點擊 **臨時載入附加元件...**，選擇項目目錄下的 `manifest.json` 文件。
6. 打開新分頁，開始體驗吧！✨

> *提示*: 在 Firefox 中臨時載入的擴充功能會在瀏覽器重啟後移除。
</details>

## 🎐 網絡與連線

本擴充功能需要訪問 Pixiv (`pixiv.net` 和 `pximg.net`) 獲取數據。
> 如果新分頁一直停留在載入動畫，說明你的網絡無法連接 Pixiv。請自行檢查網絡連接或代理設定。本擴充功能**不提供**任何代理功能。

## 📜 許可證

詳情請參閱 [LICENSE](LICENSE) 文件。

## 🤝 貢獻與參與

歡迎提交 Issue 或 PR！貢獻指南請參閱 [CONTRIBUTING.md](CONTRIBUTING.md)。

## 💖 支持與讚賞

如果你喜歡 PixTab，歡迎支持與讚賞！你的鼓勵是我前進的動力。(╹▽╹)

- [愛發電 (Afdian)](https://afdian.com/a/cloud09)
- [Patreon](https://www.patreon.com/cloud09_official)

## 🌟 致謝

本項目的靈感來源於以下項目：
- [HumbleNewTabPage](https://github.com/ibillingsley/HumbleNewTabPage)
- [PixivforMuzei3](https://github.com/yellowbluesky/PixivforMuzei3)
