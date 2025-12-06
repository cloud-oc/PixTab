# PixTab <img src="icons/icon-128.png" width="36" height="36" align="right" alt="icon">

<a href="https://github.com/cloud-oc/PixTab/blob/main/README.md"><img src="https://img.shields.io/badge/English-blue?style=for-the-badge" alt="English"></a> <a href="https://github.com/cloud-oc/PixTab/blob/main/README.zh_CN.md"><img src="https://img.shields.io/badge/简体中文-red?style=for-the-badge" alt="简体中文"></a> <a href="https://github.com/cloud-oc/PixTab/blob/main/README.zh_TW.md"><img src="https://img.shields.io/badge/繁體中文-orange?style=for-the-badge" alt="繁體中文"></a> <a href="https://github.com/cloud-oc/PixTab/blob/main/README.ja.md"><img src="https://img.shields.io/badge/日本語-green?style=for-the-badge" alt="日本語"></a> <a href="https://github.com/cloud-oc/PixTab/blob/main/README.ko.md"><img src="https://img.shields.io/badge/한국어-brightgreen?style=for-the-badge" alt="한국어"></a> <a href="https://microsoftedge.microsoft.com/addons/detail/chpabpanagjfnglcpnpdpelacjfpnfoj"><img src="https://img.shields.io/badge/Edge%20Addons-Install-blueviolet?style=for-the-badge" alt="Edge Add-ons"></a>

브라우저의 새 탭 페이지에 아름다운 Pixiv 작품을 표시합니다.

## 개요

PixTab은 새 탭 페이지에 Pixiv의 작품을 표시하는 가벼운 브라우저 확장입니다. 사용자 설정, 키워드 검색, 다국어 지원을 제공하며 Chromium 및 Firefox 기반 브라우저에서 동작합니다.

## 주요 기능

- **멋진 Pixiv 일러스트** — 새 탭을 열 때마다 Pixiv의 작품을 감상할 수 있습니다.
- **여러 정렬 방식** — 일간/주간/월간 랭킹, 신인, 오리지널, 인기 등 다양한 정렬을 지원합니다。
- **키워드 검색** — AND/OR/NOT 조합으로 태그를 정밀하게 필터링할 수 있습니다。
- **즐겨찾기(북마크) 수 필터** — 최소/최대 북마크 수로 작품을 필터링합니다。
- **작품 유형 필터** — 일러스트, 만화, 움짤(동영상)을 선택하거나 AI 생성 작품을 제외할 수 있습니다。
- **해상도 요구** — 최소 너비/높이를 설정하여 이미지 품질을 보장합니다。
- **표시 스타일** — 이미지 크기, 정렬, 평타일(타일링) 모드를 사용자 정의할 수 있습니다。
- **라이트 & 다크 테마** — 인터페이스는 시스템 시간에 따라 자동으로 전환됩니다。
- **다국어 지원** — 영어, 간체중문(简体中文), 번체중문(繁體中文), 일본어, 한국어를 지원합니다。
- **개인정보 보호 중심** — 모든 설정은 로컬에만 저장되며 외부 서버로 전송되지 않습니다。

## 설치 방법

> **Edge 사용자는 [Microsoft Edge Add-ons Store](https://microsoftedge.microsoft.com/addons/detail/chpabpanagjfnglcpnpdpelacjfpnfoj) 에서 바로 설치할 수 있습니다.**

> **참고**: 이 확장 기능은 아직 Chrome 웹 스토어나 Firefox 애드온에 정식으로 등록되어 있지 않습니다. 아래 지침에 따라 수동으로 설치하세요。

### Chromium 기반 브라우저

1. 저장소를 클론하거나 다운로드합니다。
2. 브라우저에서 `chrome://extensions`를 엽니다。
3. **개발자 모드**를 활성화합니다。
4. 방법 A — 패키지된 ZIP 사용(간단):
   - `dist/`에서 릴리스(zip)를 다운로드한 경우(예: `dist/pixtab-0.9-chrome.zip`), 일부 Chromium 브라우저에서는 해당 `.zip` 파일을 `chrome://extensions` 페이지로 드래그하여 설치할 수 있습니다。
   - 드래그가 작동하지 않으면 압축을 풀고 **Load unpacked**로 폴더를 선택하세요。

5. 방법 B — 소스에서 설치(개발자용):
   - **Load unpacked**를 클릭하고 프로젝트 폴더를 선택합니다。

6. 새 탭을 열어 PixTab이 정상 작동하는지 확인하세요。

### Firefox 기반 브라우저 (113+)

1. 저장소를 클론하거나 다운로드합니다。
2. 브라우저에서 `about:debugging#/runtime/this-firefox`를 엽니다。
3. **Load Temporary Add-on...**을 클릭합니다。
4. 방법 A — 패키지된 XPI 사용(테스트 권장):
   - `dist/*.xpi` 파일(예: `dist/pixtab-0.9-firefox.xpi`)을 다운로드한 경우, `about:addons`의 설정(톱니) 메뉴에서 **Install Add-on From File...**을 선택하거나 `.xpi` 파일을 드래그하여 설치할 수 있습니다。

5. 방법 B — 임시 애드온 로드(개발자용):
   - **Load Temporary Add-on...**을 클릭하고 `manifest.json` 파일을 선택합니다。

6. 새 탭을 열어 PixTab이 정상 작동하는지 확인하세요。

> **참고**：Firefox에서 임시로 로드한 확장 프로그램은 브라우저를 재시작하면 사라집니다。

## 네트워크 요구사항

이 확장은 Pixiv(`pixiv.net` 및 `pximg.net`)에 접근해야 합니다。

새 탭 페이지가 로딩 애니메이션에 멈춰 있으면 네트워크가 Pixiv에 접근하지 못하는 경우입니다。네트워크 문제를 해결해 주세요。이 확장은 프록시 기능을 제공하지 않습니다。

## 라이선스

자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요。

## 감사

영감 받은 프로젝트：

- [HumbleNewTabPage](https://github.com/ibillingsley/HumbleNewTabPage)
- [PixivforMuzei3](https://github.com/yellowbluesky/PixivforMuzei3)

