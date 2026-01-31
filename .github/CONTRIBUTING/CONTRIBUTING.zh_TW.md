# 參與貢獻 PixTab

[English](../../CONTRIBUTING.md) | [简体中文](CONTRIBUTING.zh_CN.md) | [日本語](CONTRIBUTING.ja.md) | [한국어](CONTRIBUTING.ko.md) | [Русский](CONTRIBUTING.ru.md)

感謝你對 PixTab 的關注！我們非常歡迎 bug 報告、功能建議、代碼優化以及翻譯貢獻。

## 開發準備

- **Node.js**: v18+ (推薦 v20)
- **Git**: 用於版本控制
- **瀏覽器**: Chrome, Edge, 或 Firefox (較新版本)

## 環境搭建

```bash
# 克隆倉庫
git clone https://github.com/cloud-oc/PixTab.git
cd PixTab
```

### 載入擴充功能測試

**Chrome/Edge:**
1. 打開 `chrome://extensions`。
2. 開啟右上角的 **開發者模式**。
3. 點擊 **載入解壓縮擴充功能**，選擇專案根目錄。
4. 打開新分頁即可看到 PixTab 效果。

**Firefox:**
1. 在網址列輸入 `about:debugging#/runtime/this-firefox`。
2. 點擊 **載入暫時性附加組件...**。
3. 選擇專案根目錄下的 `manifest.json` 文件。

## 專案結構

- `manifest.json`: 擴充功能入口配置。
- `src/`: 原始碼目錄。
  - `newtab/`: 新分頁邏輯。
  - `options/`: 設定面板邏輯。
  - `background/`: 背景服務腳本 (Service Worker)。
  - `shared/`: 通用工具和共享邏輯。
- `_locales/`: 多語言翻譯文件。
- `build/`: 構建與打包腳本。

## 打包發佈

生成用於正式發佈的安裝包：

```bash
# Windows
.\build\build.bat

# macOS/Linux
chmod +x build/build.sh
./build/build.sh
```
打包結果將存放在 `dist/` 目錄中（該目錄已被 Git 忽略）。

## 添加翻譯貢獻

翻譯文件位於 `_locales/{lang}/messages.json`。

1.  在 `_locales/` 下根據 ISO 語言代碼創建新資料夾（例如西班牙語為 `es`）。
2.  將 `_locales/en/messages.json` 複製到新資料夾中。
3.  僅翻譯 `"message"` 字段的值。**請勿**修改鍵名。
4.  通過切換瀏覽器語言來驗證你的翻譯效果。

## 提交更改

1.  **分支**: 創建描述性分支：`git checkout -b feature/cool-feature`。
2.  **測試**: 確保更改在 Chrome 系瀏覽器和 Firefox 中均正常工作。
3.  **提交**: 使用清晰的提交信息：`git commit -m "簡要描述你的更改"`。
4.  **公關 (PR)**: 提交 PR，並詳細說明解決的問題或新增的功能。

---

有任何疑問？歡迎提交 Issue。感謝你讓 PixTab 變得更好！
