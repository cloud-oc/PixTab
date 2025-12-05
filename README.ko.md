# PixTab <img src="icons/icon-128.png" width="36" height="36" align="right" alt="icon">

<a href="https://github.com/cloud-oc/PixTab/blob/main/README.md"><img src="https://img.shields.io/badge/English-blue?style=for-the-badge" alt="English"></a> <a href="https://github.com/cloud-oc/PixTab/blob/main/README.zh-CN.md"><img src="https://img.shields.io/badge/简体中文-red?style=for-the-badge" alt="简体中文"></a> <a href="https://github.com/cloud-oc/PixTab/blob/main/README.zh-TW.md"><img src="https://img.shields.io/badge/繁體中文-orange?style=for-the-badge" alt="繁體中文"></a> <a href="https://github.com/cloud-oc/PixTab/blob/main/README.ja.md"><img src="https://img.shields.io/badge/日本語-green?style=for-the-badge" alt="日本語"></a> <a href="https://github.com/cloud-oc/PixTab/blob/main/README.ko.md"><img src="https://img.shields.io/badge/한국어-brightgreen?style=for-the-badge" alt="한국어"></a>

브라우저의 새 탭 페이지에 아름다운 Pixiv 작품을 표시합니다.

## 개요

PixTab은 새 탭 페이지에 Pixiv 작품을 표시하는 가벼운 브라우저 확장입니다. 사용자 설정, 키워드 검색, 다국어 지원을 제공하며 Chromium 및 Firefox 기반 브라우저에서 동작합니다.

## 주요 기능


 **다국어 지원** — 현재 영어, 간체 중국어, 번체 중국어, 일본어, 한국어를 지원합니다.

> **참고**: 이 확장 프로그램은 Chrome 웹 스토어나 Firefox 애드온으로 등록되어 있지 않습니다. 아래 절차에 따라 수동으로 설치하세요.

### Chromium 기반 브라우저

1. 저장소를 클론하거나 다운로드합니다.
2. 브라우저에서 `chrome://extensions`를 엽니다.
3. **개발자 모드**를 활성화합니다.
4. 옵션 A — 패키지된 ZIP에서 설치 (간단):
   - `dist/`에서 릴리스를 다운로드한 경우(예: `dist/pixtab-0.9-chrome.zip`), 일부 Chromium 브라우저에서는 ZIP 파일을 `chrome://extensions` 페이지로 드래그하여 설치할 수 있습니다.
   - 드래그 앤 드롭이 작동하지 않으면 패키지를 압축 해제한 뒤 **Load unpacked**로 폴더를 선택하세요.

5. 옵션 B — 소스에서 설치 (개발자):
   - **Load unpacked**를 클릭하고 프로젝트 폴더를 선택합니다.

6. 새 탭을 열어 PixTab이 작동하는지 확인하세요!

### Firefox 기반 브라우저 (113+)

1. 이 저장소를 클론하거나 다운로드합니다.
2. 브라우저에서 `about:debugging#/runtime/this-firefox`를 엽니다.
3. **Load Temporary Add-on...**을 클릭합니다.
4. 옵션 A — 패키지된 XPI에서 설치 (테스트 권장):
   - `dist/*.xpi` 파일을 다운로드한 경우, `about:addons`의 설정(톱니) 메뉴에서 **Install Add-on From File...**을 선택하거나 XPI 파일을 드래그하여 설치할 수 있습니다.

5. 옵션 B — 임시 애드온 로드 (개발자):
   - **Load Temporary Add-on...**을 클릭하고 `manifest.json` 파일을 선택합니다.

6. 새 탭을 열어 PixTab이 작동하는지 확인하세요!

## 네트워크 요구사항

이 확장은 Pixiv(`pixiv.net` 및 `pximg.net`)에 접근해야 합니다.

새 탭 페이지가 로딩 애니메이션에서 멈춘다면 네트워크가 Pixiv에 접근하지 못하는 것입니다. 이 경우 네트워크 문제를 해결하세요. 이 확장은 프록시 기능을 제공하지 않습니다.

## 라이선스

자세한 내용은 [LICENSE](LICENSE)를 참조하세요.

## 감사

영감 받은 프로젝트:

- [HumbleNewTabPage](https://github.com/ibillingsley/HumbleNewTabPage)
- [PixivforMuzei3](https://github.com/yellowbluesky/PixivforMuzei3)

