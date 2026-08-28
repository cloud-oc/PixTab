# 参与贡献 PixTab

[English](../../CONTRIBUTING.md) | [繁體中文](CONTRIBUTING.zh_TW.md) | [日本語](CONTRIBUTING.ja.md) | [한국어](CONTRIBUTING.ko.md) | [Русский](CONTRIBUTING.ru.md)

感谢你对 PixTab 的关注！我们非常欢迎 bug 报告、功能建议、代码优化以及翻译贡献。

## 开发准备

- **Node.js**: v18+ (推荐 v20)
- **Git**: 用于版本控制
- **浏览器**: Chrome, Edge, 或 Firefox (较新版本)

## 环境搭建

```bash
# 克隆仓库
git clone https://github.com/cloud-oc/PixTab.git
cd PixTab
npm install
```

### 加载扩展进行测试

**Chrome/Edge:**
1. 打开 `chrome://extensions`。
2. 开启右上角的 **开发者模式**。
3. 点击 **加载已解压的扩展程序**，选择项目根目录。
4. 打开新标签页即可看到 PixTab 效果。

**Firefox:**
1. 运行 `npm run build`。
2. 在地址栏输入 `about:debugging#/runtime/this-firefox`。
3. 点击 **临时载入附加组件...**。
4. 选择 `dist/firefox/manifest.json`。

## 项目结构

- `manifest.json`: 扩展入口配置文件。
- `src/`: 源代码目录。
  - `entrypoints/`: 精简的浏览器入口。
  - `application/`: 图片获取编排、预取和消息路由。
  - `domain/`: 纯偏好、查询、过滤和消息契约。
  - `infrastructure/`: 浏览器、网络和 Pixiv 适配器。
  - `ui/`: 新标签页和设置页的控制器与视图。
  - `newtab/` 和 `options/`: 静态 HTML/CSS 外壳。
- `_locales/`: 多语言翻译文件。
- `build/`: 构建与打包脚本。

## 打包发布

生成用于正式发布的安装包：

```bash
npm run build
```

打包结果将存放在 `dist/` 目录中（该目录已被 Git 忽略）。

运行 `npm run check` 可执行完整验证：单元测试和 DOM 测试、两个浏览器的构建、Firefox 清单验证，以及使用 Playwright Chromium 加载打包后的扩展。

## 添加翻译贡献

翻译文件位于 `_locales/{lang}/messages.json`。

1.  在 `_locales/` 下根据 ISO 语言代码创建新文件夹（例如西班牙语为 `es`）。
2.  将 `_locales/en/messages.json` 复制到新文件夹中。
3.  仅翻译 `"message"` 字段的值。**请勿**修改键名。
4.  通过切换浏览器语言来验证你的翻译效果。

## 提交更改

1.  **分支**: 创建描述性分支：`git checkout -b feature/cool-feature`。
2.  **测试**: 确保更改在 Chrome 系浏览器和 Firefox 中均正常工作。
3.  **提交**: 使用清晰的提交信息：`git commit -m "简要描述你的更改"`。
4.  **PR**: 提交 PR，并详细说明解决的问题或新增的功能。

---

有任何疑问？欢迎提交 Issue。感谢你让 PixTab 变得更好！
