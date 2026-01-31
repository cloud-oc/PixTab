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
```

### 加载扩展进行测试

**Chrome/Edge:**
1. 打开 `chrome://extensions`。
2. 开启右上角的 **开发者模式**。
3. 点击 **加载已解压的扩展程序**，选择项目根目录。
4. 打开新标签页即可看到 PixTab 效果。

**Firefox:**
1. 在地址栏输入 `about:debugging#/runtime/this-firefox`。
2. 点击 **临时载入附加组件...**。
3. 选择项目根目录下的 `manifest.json` 文件。

## 项目结构

- `manifest.json`: 扩展入口配置文件。
- `src/`: 源代码目录。
  - `newtab/`: 新标签页逻辑。
  - `options/`: 设置面板逻辑。
  - `background/`: 后台服务脚本 (Service Worker)。
  - `shared/`: 通用工具和共享逻辑。
- `_locales/`: 多语言翻译文件。
- `build/`: 构建与打包脚本。

## 打包发布

生成用于正式发布的安装包：

```bash
# Windows
.\build\build.bat

# macOS/Linux
chmod +x build/build.sh
./build/build.sh
```
打包结果将存放在 `dist/` 目录中（该目录已被 Git 忽略）。

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
4.  **公关 (PR)**: 提交 PR，并详细说明解决的问题或新增的功能。

---

有任何疑问？欢迎提交 Issue。感谢你让 PixTab 变得更好！
