#!/bin/bash

# PixTab 打包脚本
# 使用 Node.js 处理 JSON，避免 sed 产生的语法错误

set -e

# 切换到项目根目录
cd "$(dirname "$0")/.."

echo "🔨 开始打包 PixTab..."

# 检查是否安装了 node
if ! command -v node &> /dev/null; then
    echo "❌ 错误: 需要安装 Node.js 才能运行此脚本"
    exit 1
fi

# 从 manifest.json 读取版本号 (使用 node 读取更稳健)
VERSION=$(node -e "console.log(require('./manifest.json').version)")
echo "📋 版本号: $VERSION"

# 清空并重建 dist 目录
rm -rf dist
mkdir -p dist

# ------------------------------------------------------------------
# 📦 1. 打包 Chrome/Edge 版本
# ------------------------------------------------------------------
echo "📦 打包 Chrome/Edge 版本..."
zip -r "dist/pixtab-${VERSION}-chrome.zip" manifest.json LICENSE index.html options.html style.css _locales icons src -x "*.git*" -x "*.DS_Store"

# ------------------------------------------------------------------
# 📦 2. 打包 Firefox 版本
# ------------------------------------------------------------------
echo "📦 打包 Firefox 版本..."
cp manifest.json manifest.backup.json

# --- 关键修改：使用 Node.js 脚本修改 manifest ---
# 这段脚本会自动处理逗号、格式和字段替换，100% 安全
node -e "
const fs = require('fs');
const manifestPath = 'manifest.json';
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

// 1. 修改 background: 把 service_worker 换成 scripts
if (manifest.background && manifest.background.service_worker) {
    const swPath = manifest.background.service_worker;
    manifest.background.scripts = [swPath];
    delete manifest.background.service_worker;
    // 移除 type: module（Firefox 不支持）
    if (manifest.background.type) delete manifest.background.type;
}

// 2. 转换 action.default_icon（如果是对象）为单字符串（优先 48 -> 32 -> 16 -> 128）
if (manifest.action && manifest.action.default_icon && typeof manifest.action.default_icon === 'object') {
    const sizes = ['48', '32', '16', '128'];
    let selected = null;
    for (const s of sizes) { if (manifest.action.default_icon[s]) { selected = manifest.action.default_icon[s]; break; } }
    if (!selected) selected = 'icons/icon-48.png';
    manifest.action.default_icon = selected;
}

// 3. 确保 browser_specific_settings.gecko 的字段存在并合法，解决 Firefox 警告
if (!manifest.browser_specific_settings) manifest.browser_specific_settings = {};
if (!manifest.browser_specific_settings.gecko) manifest.browser_specific_settings.gecko = {};
// gecko.strict_min_version: set to a version that supports data_collection_permissions (>=140) and options_page (>=126)
manifest.browser_specific_settings.gecko.strict_min_version = '142.0';
// gecko_android: set explicit Android min version to satisfy Android-specific warnings
manifest.browser_specific_settings.gecko_android = { strict_min_version: '142.0' };
// data_collection_permissions: requires 'none' entry in required
manifest.browser_specific_settings.gecko.data_collection_permissions = manifest.browser_specific_settings.gecko.data_collection_permissions || { collects: false, required: ['none'], optional: [] };

fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
"
# ------------------------------------------------------

zip -r "dist/pixtab-${VERSION}-firefox.xpi" manifest.json LICENSE index.html options.html style.css _locales icons src -x "*.git*" -x "*.DS_Store"

# 恢复原始 manifest
mv manifest.backup.json manifest.json

echo ""
echo "✅ 打包完成!"
echo " - dist/pixtab-${VERSION}-chrome.zip"
echo " - dist/pixtab-${VERSION}-firefox.xpi"