# PixTab <img src="icons/icon-128.png" width="36" height="36" align="right" alt="icon">

<a href="https://github.com/cloud-oc/PixTab/blob/main/README.md"><img src="https://img.shields.io/badge/English-blue?style=for-the-badge" alt="English"></a> <a href="https://github.com/cloud-oc/PixTab/blob/main/README.zh_CN.md"><img src="https://img.shields.io/badge/简体中文-red?style=for-the-badge" alt="简体中文"></a> <a href="https://github.com/cloud-oc/PixTab/blob/main/README.zh_TW.md"><img src="https://img.shields.io/badge/繁體中文-orange?style=for-the-badge" alt="繁體中文"></a> <a href="https://github.com/cloud-oc/PixTab/blob/main/README.ja.md"><img src="https://img.shields.io/badge/日本語-green?style=for-the-badge" alt="日本語"></a> <a href="https://github.com/cloud-oc/PixTab/blob/main/README.ko.md"><img src="https://img.shields.io/badge/한국어-brightgreen?style=for-the-badge" alt="한국어"></a> <a href="https://github.com/cloud-oc/PixTab/blob/main/README.ru.md"><img src="https://img.shields.io/badge/Русский-purple?style=for-the-badge" alt="Русский"></a>

<a href="https://microsoftedge.microsoft.com/addons/detail/chpabpanagjfnglcpnpdpelacjfpnfoj"><img src="https://img.shields.io/badge/Edge%20Addons-Install-blueviolet?style=for-the-badge&logo=microsoftedge&logoColor=white" alt="Edge Add-ons"></a> <a href="https://addons.mozilla.org/firefox/addon/pixtab/"><img src="https://img.shields.io/badge/Firefox%20Addons-Install-orange?style=for-the-badge&logo=firefox&logoColor=white" alt="Firefox Add-ons"></a>


## Overview

PixTab is a lightweight browser extension that displays Pixiv artworks on your new tab page. It supports custom configuration, keyword search, localization, and works with both Chromium and Firefox-based browsers.

## Key Features

- **Beautiful Pixiv artworks** — Enjoy Pixiv illustrations every time you open a new tab.
- **Multiple sorting options** — Daily/Weekly/Monthly rankings, Rookie, Original, Popular and more.
- **Keyword search** — Combine AND, OR, NOT keywords to filter artworks by tags.
- **Bookmark filter** — Set min/max bookmark range to filter artworks by popularity.
- **Artwork type filter** — Choose illustrations, manga, ugoira, or hide AI-generated works.
- **Resolution requirements** — Set minimum width/height to ensure image quality.
- **Display customization** — Customize image size, alignment, and tiling mode.
- **Light & Dark themes** — Interface theme automatically switches with system time.
- **Multi-language support** — Available in English, Simplified Chinese, Traditional Chinese, Japanese, Korean, and Russian.
- **Privacy-friendly** — All settings stored locally, no data sent to external servers.


## Installation

> **Edge users can now install PixTab directly from the [Microsoft Edge Add-ons Store](https://microsoftedge.microsoft.com/addons/detail/chpabpanagjfnglcpnpdpelacjfpnfoj).**
>
> **Firefox users can now install PixTab directly from [Firefox Add-ons](https://addons.mozilla.org/firefox/addon/pixtab/).**

> **Note**: This extension is not listed on the Chrome Web Store. Chrome users, please install it manually using the steps below.

### Chromium-based Browsers

1. Clone or download this repository.
2. Open `chrome://extensions` in your browser.
3. Enable **Developer mode**.
4. Option A — Install from packaged ZIP (quick):
	- If you downloaded a release from `dist/` (for example `dist/pixtab-0.9-chrome.zip`), some Chromium-based browsers allow you to drag the `.zip` file onto the `chrome://extensions` page to install it directly. If that works, the extension will be installed and ready to use.
	- If drag-and-drop does not work for your browser, unzip the package and use **Load unpacked** to select the extracted folder.

5. Option B — Install from source (developer):
	- Click **Load unpacked** and select the project folder.

6. Open a new tab to see PixTab in action!

### Firefox-based Browsers (140+)

1. Clone or download this repository.
2. Use Firefox 140 or later, and open `about:debugging#/runtime/this-firefox` in your browser.
3. Click **Load Temporary Add-on...**
4. Option A — Install the packaged XPI (recommended for testing):
	- If you downloaded a release `dist/*.xpi` (for example `dist/pixtab-0.9-firefox.xpi`), open `about:addons` and use the gear menu → **Install Add-on From File...**, or drag the `.xpi` file onto the Add-ons page to install it.

5. Option B — Load temporary add-on (developer):
	- Click **Load Temporary Add-on...** and select the `manifest.json` file in the project folder.

6. Open a new tab to see PixTab in action!

> **Note**: Temporarily loaded extensions in Firefox will be removed when the browser restarts.

## Network Requirements

This extension requires access to Pixiv (`pixiv.net` and `pximg.net`).

If the new tab page stays on the loading animation, it means your network cannot access Pixiv. Please resolve the network issue on your own. This extension does not provide any proxy functionality.

## License

See the [LICENSE](LICENSE) file for details.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidelines.

## Support & Donation

If PixTab has been helpful to you, I would be incredibly grateful for your support and donations. Every bit of encouragement keeps me going and means so much to me. Thank you from the bottom of my heart! (╹▽╹)

- [Afdian (爱发电)](https://afdian.com/a/cloud09)
- [Patreon](https://www.patreon.com/cloud09_official)

## Acknowledgements

This project was inspired by:

- [HumbleNewTabPage](https://github.com/ibillingsley/HumbleNewTabPage)
- [PixivforMuzei3](https://github.com/yellowbluesky/PixivforMuzei3)
