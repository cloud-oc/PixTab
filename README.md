# PixTab <img src="icons/icon-128.png" width="36" height="36" align="right" alt="icon">

<a href="https://github.com/cloud-oc/PixTab/blob/main/README.md"><img src="https://img.shields.io/badge/English-blue?style=for-the-badge" alt="English"></a> <a href="https://github.com/cloud-oc/PixTab/blob/main/README.zh.md"><img src="https://img.shields.io/badge/中文-red?style=for-the-badge" alt="中文"></a> <a href="https://github.com/cloud-oc/PixTab/blob/main/README.ja.md"><img src="https://img.shields.io/badge/日本語-green?style=for-the-badge" alt="日本語"></a>

Display beautiful Pixiv artworks on the new tab page of your browser.

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
- **Multi-language support** — Available in English, 中文, and 日本語.
- **Privacy-friendly** — All settings stored locally, no data sent to external servers.

## Try PixTab Online

Experience PixTab without installing the extension! Visit our [web demo](https://cloud-oc.github.io/PixTab/newtab/) to see PixTab in action directly in your browser. You can set it as your new tab page for a similar experience.

## Installation

> **Note**: This extension is not listed on the Chrome Web Store or Firefox Add-ons. Please install it manually using the steps below.

### Chromium-based Browsers

1. Clone or download this repository.
2. Open `chrome://extensions` in your browser.
3. Enable **Developer mode**.
4. Click **Load unpacked** and select the project folder.
5. Open a new tab to see PixTab in action!

### Firefox-based Browsers (113+)

1. Clone or download this repository.
2. Open `about:debugging#/runtime/this-firefox` in your browser.
3. Click **Load Temporary Add-on...**
4. Select the `manifest.json` file in the project folder.
5. Open a new tab to see PixTab in action!

> **Note**: Temporarily loaded extensions in Firefox will be removed when the browser restarts.

## Network Requirements

This extension requires access to Pixiv (`pixiv.net` and `pximg.net`).

If the new tab page stays on the loading animation, it means your network cannot access Pixiv. Please resolve the network issue on your own. This extension does not provide any proxy functionality.

## License

See the [LICENSE](LICENSE) file for details.

## Acknowledgements

This project was inspired by:

- [HumbleNewTabPage](https://github.com/ibillingsley/HumbleNewTabPage)
- [PixivforMuzei3](https://github.com/yellowbluesky/PixivforMuzei3)
