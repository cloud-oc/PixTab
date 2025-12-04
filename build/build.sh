#!/bin/bash

# PixTab 打包脚本
# 生成 Chrome/Edge 和 Firefox 两个版本的扩展包

set -e

# 切换到项目根目录
cd "$(dirname "$0")/.."

echo "🔨 开始打包 PixTab..."

# 从 manifest.json 读取版本号
VERSION=$(grep -o '"version": "[^"]*"' manifest.json | cut -d'"' -f4)
echo "📋 版本号: $VERSION"

# 创建 dist 目录
mkdir -p dist

# Chrome/Edge 打包
echo "📦 打包 Chrome/Edge 版本..."
zip -r "dist/pixtab-${VERSION}-chrome.zip" manifest.json LICENSE index.html options.html style.css _locales icons src -x "*.git*" -x "*.DS_Store"

# Firefox 打包（临时修改 manifest）
echo "📦 打包 Firefox 版本..."
cp manifest.json manifest.backup.json

# 替换 service_worker 为 scripts，并移除 type: module
sed -i '' 's/"service_worker": "src\/background\/runtime.js",/"scripts": ["src\/background\/runtime.js"]/' manifest.json
sed -i '' '/"type": "module"/d' manifest.json

zip -r "dist/pixtab-${VERSION}-firefox.xpi" manifest.json LICENSE index.html options.html style.css _locales icons src -x "*.git*" -x "*.DS_Store"

# 恢复原始 manifest
mv manifest.backup.json manifest.json

echo ""
echo "✅ 打包完成!"
echo "   - dist/pixtab-${VERSION}-chrome.zip  → Chrome Web Store / Edge Add-ons"
echo "   - dist/pixtab-${VERSION}-firefox.xpi → Firefox AMO"
