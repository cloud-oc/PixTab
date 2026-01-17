# Contributing to PixTab

Thank you for your interest in contributing! We welcome bug reports, feature requests, code improvements, and translations.

## Prerequisites

- **Node.js** (v12+)
- **Git**
- Chrome, Edge, or Firefox 140+

## Quick Start

```bash
git clone https://github.com/cloud-oc/PixTab.git
cd PixTab
```

### Test Locally

**Chrome/Edge:**
1. Open `chrome://extensions` → Enable **Developer mode**
2. **Load unpacked** → Select project folder
3. Open a new tab

**Firefox:**
1. Open `about:debugging#/runtime/this-firefox`
2. **Load Temporary Add-on** → Select `manifest.json`

### Build for Distribution

```bash
cd build
./build.sh        # macOS/Linux
.\build.bat       # Windows
```

Output: `dist/pixtab-{VERSION}-chrome.zip` and `dist/pixtab-{VERSION}-firefox.xpi`

## Adding Translations

Localization files are in `_locales/{lang}/messages.json`.

**Add a new language:**

```bash
mkdir _locales/es
cp _locales/en/messages.json _locales/es/messages.json
# Edit messages.json and translate all "message" values
```

**Tips:**
- Keep translations concise
- Don't modify key names, only translate `message` values
- Test by loading the extension in your target language

## Submitting Changes

1. Create a branch: `git checkout -b feature/your-feature`
2. Test in both Chrome/Edge and Firefox
3. Commit: `git commit -m "Add feature: description"`
4. Push and create a pull request

**PR Guidelines:**
- Describe changes and reference related issues
- Include screenshots for UI changes
- Test in multiple browsers

---

Questions? Open an issue on GitHub. Thank you for contributing! 
