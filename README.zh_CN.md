# PixTab <img src="icons/icon-128.png" width="36" height="36" align="right" alt="icon">

<a href="https://github.com/cloud-oc/PixTab/blob/main/README.md"><img src="https://img.shields.io/badge/English-blue?style=for-the-badge" alt="English"></a> <a href="https://github.com/cloud-oc/PixTab/blob/main/README.zh_CN.md"><img src="https://img.shields.io/badge/简体中文-red?style=for-the-badge" alt="简体中文"></a> <a href="https://github.com/cloud-oc/PixTab/blob/main/README.zh_TW.md"><img src="https://img.shields.io/badge/繁體中文-orange?style=for-the-badge" alt="繁體中文"></a> <a href="https://github.com/cloud-oc/PixTab/blob/main/README.ja.md"><img src="https://img.shields.io/badge/日本語-green?style=for-the-badge" alt="日本語"></a> <a href="https://github.com/cloud-oc/PixTab/blob/main/README.ko.md"><img src="https://img.shields.io/badge/한국어-brightgreen?style=for-the-badge" alt="한국어"></a>

<a href="https://microsoftedge.microsoft.com/addons/detail/chpabpanagjfnglcpnpdpelacjfpnfoj"><img src="https://img.shields.io/badge/Edge%20Addons-Install-blueviolet?style=for-the-badge&logo=microsoftedge&logoColor=white" alt="Edge Add-ons"></a> <a href="https://addons.mozilla.org/firefox/addon/pixtab/"><img src="https://img.shields.io/badge/Firefox%20Addons-Install-orange?style=for-the-badge&logo=firefox&logoColor=white" alt="Firefox Add-ons"></a>


## 简介

PixTab 是一款轻量级浏览器扩展，可在新标签页显示来自 Pixiv 的作品，支持自定义配置、关键词搜索和本地化设置，同时支持 Chromium 与 Firefox 内核的浏览器。

## 主要功能

- **精美 Pixiv 插画** — 每次打开新标签页都能欣赏 Pixiv 上的作品。
- **多种排序方式** — 支持每日/每周/每月排行榜、新人榜、原创榜、人气榜等。
- **关键词搜索** — 支持 AND、OR、NOT 组合关键词，按标签精准筛选作品。
- **收藏数筛选** — 设置最低/最高收藏数范围，通过收藏数筛选作品。
- **作品类型过滤** — 可选插画、漫画、动图，或仅看非 AI 生成作品。
- **分辨率要求** — 设置最小宽高，确保图片清晰度。
- **显示样式** — 自定义图片尺寸、对齐方式和平铺模式。
- **明亮 & 暗黑主题** — 界面主题自动随系统时间切换。
- **多语言支持** — 提供 英语、简体中文、繁體中文、日语、韩语 五种界面语言。
- **隐私友好** — 所有设置保存在本地，不向外部服务器发送任何数据。


## 安装方法

> **Edge 用户可直接在 [Microsoft Edge Add-ons Store](https://microsoftedge.microsoft.com/addons/detail/chpabpanagjfnglcpnpdpelacjfpnfoj) 安装本扩展。**
>
> **Firefox 用户可直接在 [Firefox Add-ons](https://addons.mozilla.org/firefox/addon/pixtab/) 官方商店安装本扩展。**

> **注意**：本扩展暂未上架 Chrome Web Store，Chrome 用户请按以下步骤手动安装。

### Chromium 内核浏览器

1. 克隆或下载本仓库。
2. 在浏览器中打开 `chrome://extensions`。
3. 启用 **开发者模式**。
4. 方案 A — 使用打包文件（更便捷）：
	- 如果你从 Releases 下载了 `dist/` 下的打包文件（例如 `dist/pixtab-0.9-chrome.zip`），部分 Chromium 浏览器支持将该 `.zip` 文件直接拖拽到 `chrome://extensions` 页面进行安装。如果拖拽生效，扩展会直接安装并可使用。
	- 若你的浏览器不支持直接拖拽安装，请先解压 `.zip`，然后使用 **加载已解压的扩展程序（Load unpacked）** 选择解压后的文件夹进行安装。

5. 方案 B — 从源码安装（开发者模式）：
	- 点击 **加载已解压的扩展程序（Load unpacked）** 并选择项目文件夹。

6. 打开新标签页，即可体验 PixTab！

### Firefox 内核浏览器（113+）

1. 克隆或下载本仓库。
2. 在浏览器中打开 `about:debugging#/runtime/this-firefox`。
3. 点击 **临时加载附加组件...**。
4. 方案 A — 使用打包的 XPI（便于测试）：
	- 如果你下载了 `dist/*.xpi`（例如 `dist/pixtab-0.9-firefox.xpi`），可以打开 `about:addons`，通过齿轮菜单选择 **从文件安装附加组件...（Install Add-on From File...）**，或将 `.xpi` 拖拽到扩展管理页面进行安装。

5. 方案 B — 临时加载（开发者）：
	- 点击 **临时加载附加组件...** 并选择项目文件夹中的 `manifest.json` 文件。

6. 打开新标签页，即可体验 PixTab！

> **提示**：Firefox 临时加载的扩展在浏览器重启后会失效，需要重新加载。

## 网络要求

本扩展需要能够正常访问 Pixiv（`pixiv.net` 和 `pximg.net`）。

如果新标签页一直停留在加载动画，说明当前网络无法访问 Pixiv，请自行解决网络问题。本扩展不提供任何代理功能。

## 许可证

详见 [LICENSE](LICENSE) 文件。

## 致谢

本项目的灵感来源于：

- [HumbleNewTabPage](https://github.com/ibillingsley/HumbleNewTabPage)
- [PixivforMuzei3](https://github.com/yellowbluesky/PixivforMuzei3)
