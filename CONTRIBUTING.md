# Contributing to PixTab

[简体中文](.github/CONTRIBUTING/CONTRIBUTING.zh_CN.md) | [繁體中文](.github/CONTRIBUTING/CONTRIBUTING.zh_TW.md) | [日本語](.github/CONTRIBUTING/CONTRIBUTING.ja.md) | [한국어](.github/CONTRIBUTING/CONTRIBUTING.ko.md) | [Русский](.github/CONTRIBUTING/CONTRIBUTING.ru.md)

Thank you for your interest in contributing to PixTab! We welcome bug reports, feature requests, code improvements, and translations.

## Prerequisites

- **Node.js**: v18+ (v20 recommended)
- **Git**: For version control
- **Browsers**: Chrome, Edge, or Firefox (recent versions)

## Development Environment Setup

```bash
# Clone the repository
git clone https://github.com/cloud-oc/PixTab.git
cd PixTab
```

### Loading the Extension for Testing

**Chrome/Edge:**
1. Open `chrome://extensions`.
2. Enable **Developer mode** (top right).
3. Click **Load unpacked** and select the root directory of this project.
4. Open a new tab to see PixTab in action.

**Firefox:**
1. Open `about:debugging#/runtime/this-firefox`.
2. Click **Load Temporary Add-on...**.
3. Select the `manifest.json` file in the project root.

## Project Structure

- `manifest.json`: Extension entry point.
- `src/`: Source code.
  - `newtab/`: Logic for the new tab page.
  - `options/`: Logic for the settings panel.
  - `background/`: Service worker for background tasks.
  - `shared/`: Utilities and shared logic.
- `_locales/`: Localization strings.
- `build/`: Build and packaging scripts.

## Building for Distribution

To package the extension for the Web Store or Firefox AMO:

```bash
# Windows
.\build\build.bat

# macOS/Linux
chmod +x build/build.sh
./build/build.sh
```
The output will be generated in the `dist/` directory (ignored by Git).

## Adding Translations

Localization files are located in `_locales/{lang}/messages.json`.

1.  Create a new folder in `_locales/` using the ISO language code (e.g., `es` for Spanish).
2.  Copy `_locales/en/messages.json` to your new folder.
3.  Translate only the `"message"` values. **Do not** change the key names.
4.  Test the extension by changing your browser's language.

## Submitting Changes

1.  **Branching**: Create a descriptive branch: `git checkout -b feature/cool-feature`.
2.  **Testing**: Ensure changes work in both Chrome-based browsers and Firefox.
3.  **Committing**: Use clear commit messages: `git commit -m "Brief description of change"`.
4.  **Pull Request**: Submit your PR with a clear description of the problem solved or feature added.

---

Questions? Feel free to open an issue. Thank you for making PixTab better!
