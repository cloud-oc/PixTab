#!/bin/bash
# PixTab Build Script (macOS/Linux)
# Generates Chrome/Edge and Firefox extension packages
set -e

SCRIPT_DIR="$(dirname "$0")"
cd "$SCRIPT_DIR/.."

echo "🔨 [BUILD] Starting PixTab packaging..."

# Read version from manifest.json
VERSION=$(node -e "console.log(require('./manifest.json').version)")
echo "📋 [INFO] Version: $VERSION"

rm -rf dist
mkdir -p dist

# Chrome/Edge packaging
echo "📦 [PACK] Building Chrome/Edge version..."
zip -r "dist/pixtab-${VERSION}-chrome.zip" manifest.json LICENSE index.html options.html style.css _locales icons src -x "*.git*" -x "*.DS_Store"

# Firefox packaging (temporarily modify manifest)
echo "📦 [PACK] Building Firefox version..."
cp manifest.json manifest.backup.json

# Use external Node.js script for manifest conversion (more reliable)
node "$SCRIPT_DIR/convert-manifest-firefox.js"

zip -r "dist/pixtab-${VERSION}-firefox.xpi" manifest.json LICENSE index.html options.html style.css _locales icons src -x "*.git*" -x "*.DS_Store"

# Restore original manifest
mv manifest.backup.json manifest.json

echo ""
echo "✅ [DONE] Packaging complete!"
echo "   - dist/pixtab-${VERSION}-chrome.zip  -> Chrome Web Store / Edge Add-ons"
echo "   - dist/pixtab-${VERSION}-firefox.xpi -> Firefox AMO"