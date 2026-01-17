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
    <strong>✨ 让 Pixiv 上的插画成为你的浏览器新标签页！✨</strong>
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

## ✨ 简介

**PixTab** 是一款轻量级、高颜值的浏览器扩展，它能让你每次打开新标签页时都欣赏到来自 Pixiv 的精选插画。支持自定义配置、关键词搜索、本地化，并且完美支持 Chromium 和 Firefox 系列浏览器。(✿◡‿◡)

## 💎 主要功能

- 🎨 **精美插画** — 每次打开新标签页，邂逅高质量的 Pixiv 画作。
- 📊 **多榜单支持** — 日榜、周榜、月榜、新人榜、原创榜、受男性/女性欢迎榜等！
- 🔍 **关键词搜索** — 支持 AND、OR、NOT 组合查询，精准定位你的喜好。
- 🔖 **收藏数过滤** — 设置最小/最大收藏数，只看热门作品。
- 🖼️ **类型筛选** — 选择插画、漫画、动图 (Ugoira)，或屏蔽 AI 生成作品。
- 📏 **画质控制** — 设置最小宽/高，拒绝模糊图。
- 🛠️ **个性化定制** — 自由调整图片大小、对齐方式和平铺模式。
- 🌓 **主题同步** — 界面主题随系统时间自动切换深色/浅色模式。
- 🌍 **多语言支持** — 提供简体中文、繁體中文、英语、日语、韩语、俄语。
- 🛡️ **隐私优先** — 所有设置仅保存在本地，绝不向外部服务器上传任何数据。

## 🚀 安装指南

> **注意**：本扩展未上架 Chrome 应用商店。Chrome 用户请按照以下步骤手动安装。

<details>
<summary><strong>📥 Chromium 内核浏览器 (Chrome, Edge, Brave...)</strong></summary>

1. 克隆或下载本仓库。
2. 在浏览器地址栏输入 `chrome://extensions` 并打开。
3. 开启右上角的 **开发者模式** (Developer mode)。
4. **方法 A — 安装打包好的 ZIP (推荐):**
    - 如果你下载了 `dist/` 目录下的发布包 (如 `dist/pixtab-0.9-chrome.zip`)，尝试直接将 `.zip` 文件拖入扩展管理页面。
    - 如果拖拽无效，请解压该压缩包，然后点击 **加载已解压的扩展程序** (Load unpacked)，选择解压后的文件夹。
5. **方法 B — 源码安装 (开发者):**
    - 点击 **加载已解压的扩展程序**，直接选择项目根目录。
6. 打开新标签页，开始体验吧！✨
</details>

<details>
<summary><strong>🦊 Firefox 内核浏览器 (140+)</strong></summary>

1. 克隆或下载本仓库。
2. 使用 Firefox 140 或更高版本，访问 `about:debugging#/runtime/this-firefox`。
3. 点击 **临时载入附加组件...** (Load Temporary Add-on)。
4. **方法 A — 安装 XPI 包 (测试用):**
    - 如果你下载了 `dist/*.xpi` (如 `dist/pixtab-0.9-firefox.xpi`)，打开 `about:addons`，点击齿轮图标 ⚙️ → **从文件安装附加组件...**，或直接将 `.xpi` 文件拖入页面。
5. **方法 B — 临时载入 (开发者):**
    - 点击 **临时载入附加组件...**，选择项目目录下的 `manifest.json` 文件。
6. 打开新标签页，开始体验吧！✨

> *提示*: 在 Firefox 中临时载入的扩展会在浏览器重启后移除。
</details>

## 🎐 网络与连接

本扩展需要访问 Pixiv (`pixiv.net` 和 `pximg.net`) 获取数据。
> 如果新标签页一直停留在加载动画，说明你的网络无法连接 Pixiv。请自行检查网络连接或代理设置。本扩展**不提供**任何代理功能。

## 📜 许可证

详情请参阅 [LICENSE](LICENSE) 文件。

## 🤝 贡献与参与

欢迎提交 Issue 或 PR！贡献指南请参阅 [CONTRIBUTING.md](CONTRIBUTING.md)。

## 💖 支持与赞赏

如果你喜欢 PixTab，欢迎支持与赞赏！你的鼓励就是我前进的动力。(╹▽╹)

- [爱发电 (Afdian)](https://afdian.com/a/cloud09)
- [Patreon](https://www.patreon.com/cloud09_official)

## 🌟 致谢

本项目的灵感来源于以下项目：
- [HumbleNewTabPage](https://github.com/ibillingsley/HumbleNewTabPage)
- [PixivforMuzei3](https://github.com/yellowbluesky/PixivforMuzei3)
