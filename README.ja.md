# PixTab <img src="icons/icon-128.png" width="36" height="36" align="right" alt="icon">

<a href="https://github.com/cloud-oc/PixTab/blob/main/README.md"><img src="https://img.shields.io/badge/English-blue?style=for-the-badge" alt="English"></a> <a href="https://github.com/cloud-oc/PixTab/blob/main/README.zh_CN.md"><img src="https://img.shields.io/badge/简体中文-red?style=for-the-badge" alt="简体中文"></a> <a href="https://github.com/cloud-oc/PixTab/blob/main/README.zh_TW.md"><img src="https://img.shields.io/badge/繁體中文-orange?style=for-the-badge" alt="繁體中文"></a> <a href="https://github.com/cloud-oc/PixTab/blob/main/README.ja.md"><img src="https://img.shields.io/badge/日本語-green?style=for-the-badge" alt="日本語"></a> <a href="https://github.com/cloud-oc/PixTab/blob/main/README.ko.md"><img src="https://img.shields.io/badge/한국어-brightgreen?style=for-the-badge" alt="한국어"></a> <a href="https://microsoftedge.microsoft.com/addons/detail/chpabpanagjfnglcpnpdpelacjfpnfoj"><img src="https://img.shields.io/badge/Edge%20Addons-Install-blueviolet?style=for-the-badge" alt="Edge Add-ons"></a>

ブラウザの新しいタブページに美しいPixivイラストを表示します。

## 概要

PixTabは新しいタブページにPixivの作品を表示する軽量なブラウザ拡張機能です。カスタム設定、キーワード検索、多言語対応を備え、Chromium系・Firefox系ブラウザで動作します。

## 主な機能

- **美しいPixivイラスト** — 新しいタブを開くたびにPixivの作品を楽しめます。
- **多彩な並び替え** — 日/週/月ランキング、新人、オリジナル、人気など多様な並び替えに対応。
- **キーワード検索** — AND/OR/NOT組み合わせでタグを精密にフィルタリング。
- **ブックマーク数フィルタ** — 最低/最高ブックマーク数で作品を絞り込み。
- **作品タイプフィルタ** — イラスト、マンガ、動くイラスト（ugoira）、AI生成作品の非表示も可能。
- **解像度要件** — 最小幅・高さを設定し画像品質を確保。
- **表示スタイル** — 画像サイズ、配置、タイル表示をカスタマイズ。
- **ライト＆ダークテーマ** — インターフェースはシステム時間に応じて自動切替。
- **多言語対応** — 英語、簡体字中国語、繁体字中国語、日本語、韓国語に対応。
- **プライバシー重視** — 設定はすべてローカル保存、外部サーバーへデータ送信なし。

## インストール方法

> **Edgeユーザーは [Microsoft Edge Add-ons Store](https://microsoftedge.microsoft.com/addons/detail/chpabpanagjfnglcpnpdpelacjfpnfoj) から直接インストールできます。**

> **注意**：本拡張機能はChrome Web StoreやFirefox Add-onsには未掲載です。以下の手順で手動インストールしてください。

### Chromium 系ブラウザ

1. このリポジトリをクローンまたはダウンロードします。
2. ブラウザで `chrome://extensions` を開きます。
3. **デベロッパーモード** を有効にします。
4. オプション A — 配布パッケージからインストール（手早く）：
	- `dist/` にあるパッケージ（例: `dist/pixtab-0.9-chrome.zip`）をダウンロードした場合、一部の Chromium 系ブラウザではその `.zip` ファイルを `chrome://extensions` ページへドラッグ&ドロップすることで直接インストールできます。動作すれば拡張がインストールされ、そのまま使用可能です。
	- ドラッグでのインストールが動作しない場合は、`.zip` を解凍してから **Load unpacked（パッケージ化されていない拡張機能を読み込む）** で解凍フォルダを選択してください。

5. オプション B — ソースからインストール（開発者向け）:
	- **Load unpacked** をクリックしてプロジェクトフォルダを選択します。

6. 新しいタブを開くと PixTab が表示されます！

### Firefox 系ブラウザ（113+）

1. このリポジトリをクローンまたはダウンロードします。
2. ブラウザで `about:debugging#/runtime/this-firefox` を開きます。
4. オプション A — 配布用 XPI を使ってインストール（テスト向け）:
	- `dist/*.xpi`（例: `dist/pixtab-0.9-firefox.xpi`）をダウンロードした場合、`about:addons` を開き、歯車メニューから **Install Add-on From File...** を選ぶか、`.xpi` ファイルをアドオンページへドラッグしてインストールできます。

5. オプション B — 一時的に読み込む（開発者向け）:
	- **一時的なアドオンを読み込む...** をクリックし、プロジェクトフォルダ内の `manifest.json` を選択します。

6. 新しいタブを開くと PixTab が表示されます！

> **注意**：Firefox で一時的に読み込んだ拡張機能は、ブラウザの再起動時に削除されます。

## ネットワーク要件

この拡張機能は Pixiv（`pixiv.net` および `pximg.net`）へのアクセスが必要です。

新しいタブがローディングアニメーションのまま止まっている場合、ネットワークが Pixiv にアクセスできないことを意味します。ネットワークの問題はご自身で解決してください。この拡張機能はプロキシ機能を提供していません。

## ライセンス

詳細は [LICENSE](LICENSE) ファイルをご覧ください。

## 謝辞

このプロジェクトは以下からインスピレーションを受けました：

- [HumbleNewTabPage](https://github.com/ibillingsley/HumbleNewTabPage)
- [PixivforMuzei3](https://github.com/yellowbluesky/PixivforMuzei3)
