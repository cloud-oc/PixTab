#!/bin/bash
# PixTab 一键打包脚本 (macOS/Linux)
set -e

cd "$(dirname "$0")/.."

echo "🔨 开始打包 PixTab..."

# 读取版本号
VERSION=$(node -e "console.log(require('./manifest.json').version)")
echo "📋 版本号: $VERSION"

rm -rf dist
mkdir -p dist

# 打包 Chrome/Edge 版本
echo "📦 打包 Chrome/Edge 版本..."
zip -r "dist/pixtab-${VERSION}-chrome.zip" manifest.json LICENSE index.html options.html style.css _locales icons src -x "*.git*" -x "*.DS_Store"

# 打包 Firefox 版本（临时修改 manifest）
echo "📦 打包 Firefox 版本..."
cp manifest.json manifest.backup.json

# 用 Node.js 处理 manifest 字段，兼容 Firefox
node -e "
const fs = require('fs');
const manifestPath = 'manifest.json';
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
if (manifest.background && manifest.background.service_worker) {
    const swPath = manifest.background.service_worker;
    manifest.background.scripts = [swPath];
    delete manifest.background.service_worker;
    if (manifest.background.type) delete manifest.background.type;
}
if (manifest.action && manifest.action.default_icon && typeof manifest.action.default_icon === 'object') {
    const sizes = ['48', '32', '16', '128'];
    let selected = null;
    for (const s of sizes) { if (manifest.action.default_icon[s]) { selected = manifest.action.default_icon[s]; break; } }
    if (!selected) selected = 'icons/icon-48.png';
    manifest.action.default_icon = selected;
}
if (!manifest.browser_specific_settings) manifest.browser_specific_settings = {};
if (!manifest.browser_specific_settings.gecko) manifest.browser_specific_settings.gecko = {};
manifest.browser_specific_settings.gecko.strict_min_version = '142.0';
manifest.browser_specific_settings.gecko_android = { strict_min_version: '142.0' };
manifest.browser_specific_settings.gecko.data_collection_permissions = manifest.browser_specific_settings.gecko.data_collection_permissions || { collects: false, required: ['none'], optional: [] };
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
"

zip -r "dist/pixtab-${VERSION}-firefox.xpi" manifest.json LICENSE index.html options.html style.css _locales icons src -x "*.git*" -x "*.DS_Store"

mv manifest.backup.json manifest.json

echo ""
echo "✅ 打包完成!"
echo " - dist/pixtab-${VERSION}-chrome.zip"
echo " - dist/pixtab-${VERSION}-firefox.xpi"