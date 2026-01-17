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
    <strong>✨ Let Pixiv artworks become your browser's new tab page! ✨</strong>
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

## ✨ Overview

**PixTab** is a lightweight, aesthetic browser extension that displays Pixiv artworks on your new tab page. It supports custom configuration, keyword search, localization, and works beautifully with both Chromium and Firefox-based browsers. (✿◡‿◡)

## 💎 Key Features

- 🎨 **Beautiful Artworks** — Enjoy high-quality Pixiv illustrations every time you open a new tab.
- 📊 **Multiple Rankings** — Daily, Weekly, Monthly, Rookie, Original, Popular, and more!
- 🔍 **Keyword Search** — Combine AND, OR, NOT keywords to filter artworks precisely.
- 🔖 **Bookmark Filter** — Set min/max bookmark counts to find the most popular works.
- 🖼️ **Type Filter** — Choose Illustrations, Manga, Ugoira, or filter out AI-generated works.
- 📏 **Resolution Control** — Ensure high quality by setting minimum width/height.
- 🛠️ **Customization** — Adjust image size, alignment, and tiling mode to your liking.
- 🌓 **Theme Sync** — Automatically switches between Light & Dark themes.
- 🌍 **Multi-language** — Available in English, Simplified Chinese, Traditional Chinese, Japanese, Korean, and Russian.
- 🛡️ **Privacy First** — All settings are stored locally. No data is sent to external servers.

## 🚀 Installation

> **Note**: This extension is not listed on the Chrome Web Store. Chrome users, please install it manually using the steps below.

<details>
<summary><strong>📥 Chromium-based Browsers (Chrome, Edge, Brave...)</strong></summary>

1. Clone or download this repository.
2. Open `chrome://extensions` in your browser.
3. Enable **Developer mode** (usually in the top right corner).
4. **Option A — Install from packaged ZIP (Quick):**
    - If you downloaded a release from `dist/` (e.g., `dist/pixtab-0.9-chrome.zip`), try dragging the `.zip` file onto the `chrome://extensions` page.
    - If drag-and-drop fails, unzip the package and use **Load unpacked** to select the extracted folder.
5. **Option B — Install from source (Developer):**
    - Click **Load unpacked** and select the project folder.
6. Open a new tab and enjoy! ✨
</details>

<details>
<summary><strong>🦊 Firefox-based Browsers (140+)</strong></summary>

1. Clone or download this repository.
2. Use Firefox 140 or later, and open `about:debugging#/runtime/this-firefox`.
3. Click **Load Temporary Add-on...**
4. **Option A — Install packaged XPI (Testing):**
    - If you downloaded a release `dist/*.xpi` (e.g., `dist/pixtab-0.9-firefox.xpi`), open `about:addons`, click the gear icon ⚙️ → **Install Add-on From File...**, or drag the `.xpi` file onto the page.
5. **Option B — Load temporary add-on (Developer):**
    - Click **Load Temporary Add-on...** and select the `manifest.json` file in the project folder.
6. Open a new tab and enjoy! ✨

> *Note*: Temporarily loaded extensions in Firefox will be removed when the browser restarts.
</details>

## 🎐 Network Requirements

This extension requires access to Pixiv (`pixiv.net` and `pximg.net`).
> If the loading animation spins forever, it means your network cannot access Pixiv. Please check your network connection or proxy settings. This extension **does not** provide proxy functionality.

## 📜 License

See the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidelines.

## 💖 Support & Donation

If you enjoy using PixTab, please consider supporting me. Your encouragement keeps me going! (╹▽╹)

- [Afdian (爱发电)](https://afdian.com/a/cloud09)
- [Patreon](https://www.patreon.com/cloud09_official)

## 🌟 Acknowledgements

This project was inspired by:
- [HumbleNewTabPage](https://github.com/ibillingsley/HumbleNewTabPage)
- [PixivforMuzei3](https://github.com/yellowbluesky/PixivforMuzei3)
