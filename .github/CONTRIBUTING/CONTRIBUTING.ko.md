# PixTab 기여하기

[English](../../CONTRIBUTING.md) | [简体中文](CONTRIBUTING.zh_CN.md) | [繁體中文](CONTRIBUTING.zh_TW.md) | [日本語](CONTRIBUTING.ja.md) | [Русский](CONTRIBUTING.ru.md)

PixTab에 관심을 가져주셔서 감사합니다! 버그 제보, 기능 요청, 코드 개선 및 번역 기여를 환영합니다.

## 사전 준비

- **Node.js**: v18+ (v20 권장)
- **Git**: 버전 관리용
- **브라우저**: Chrome, Edge 또는 Firefox (최신 버전)

## 개발 환경 설정

```bash
# 저장소 복제
git clone https://github.com/cloud-oc/PixTab.git
cd PixTab
```

### 테스트를 위한 확장 프로그램 로드

**Chrome/Edge:**
1. `chrome://extensions`를 엽니다.
2. **개발자 모드**(우측 상단)를 활성화합니다.
3. **압축해제된 확장 프로그램을 로드합니다**를 클릭하고 프로젝트 루트 디렉토리를 선택합니다.
4. 새 탭을 열어 PixTab이 작동하는지 확인합니다.

**Firefox:**
1. `about:debugging#/runtime/this-firefox`를 엽니다.
2. **임시 부가 기능 로드...**를 클릭합니다.
3. 프로젝트 루트에 있는 `manifest.json` 파일을 선택합니다.

## 프로젝트 구조

- `manifest.json`: 확장 프로그램 엔트리 포인트.
- `src/`: 소스 코드.
  - `newtab/`: 새 탭 페이지 로직.
  - `options/`: 설정 패널 로직.
  - `background/`: 백그라운드 작업용 서비스 워커.
  - `shared/`: 유틸리티 및 공유 로직.
- `_locales/`: 로컬라이즈 문자열.
- `build/`: 빌드 및 패키징 스크립트.

## 배포용 빌드

웹 스토어 또는 Firefox AMO를 위해 확장 프로그램을 패키징하려면:

```bash
# Windows
.\build\build.bat

# macOS/Linux
chmod +x build/build.sh
./build/build.sh
```
출력물은 `dist/` 디렉토리에 생성됩니다(Git에서 무시됨).

## 번역 추가

로컬라이즈 파일은 `_locales/{lang}/messages.json`에 위치합니다.

1.  ISO 언어 코드(예: 스페인어의 경우 `es`)를 사용하여 `_locales/` 내에 새 폴더를 만듭니다.
2.  `_locales/en/messages.json`을 새 폴더로 복사합니다.
3.  `"message"` 값만 번역하고, 키 이름은 변경**하지 마세요**.
4.  브라우저 언어 설정을 변경하여 번역 결과를 테스트합니다.

## 변경 사항 제출

1.  **브랜치 생성**: 설명적인 브랜치를 생성합니다: `git checkout -b feature/cool-feature`.
2.  **테스트**: 변경 사항이 Chrome 기반 브라우저와 Firefox 모두에서 작동하는지 확인합니다.
3.  **커밋**: 명확한 커밋 메시지를 사용합니다: `git commit -m "변경 사항에 대한 간략한 설명"`.
4.  **풀 리퀘스트**: 수정된 문제나 추가된 기능에 대한 설명과 함께 PR을 제출합니다.

---

궁금한 점이 있으신가요? 언제든지 Issue를 열어주세요. PixTab을 더 좋게 만들어 주셔서 감사합니다!
