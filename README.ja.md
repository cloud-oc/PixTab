<div align="center">
  <p>
    <a href="https://github.com/cloud-oc/PixTab/blob/main/README.md"><img src="https://img.shields.io/badge/English-555555?style=flat-square" alt="English"></a>
    <a href="https://github.com/cloud-oc/PixTab/blob/main/README.zh_CN.md"><img src="https://img.shields.io/badge/简体中文-D0021B?style=flat-square" alt="简体中文"></a>
    <a href="https://github.com/cloud-oc/PixTab/blob/main/README.zh_TW.md"><img src="https://img.shields.io/badge/繁體中文-E67E22?style=flat-square" alt="繁體中文"></a>
    <a href="https://github.com/cloud-oc/PixTab/blob/main/README.ja.md"><img src="https://img.shields.io/badge/日本語-F48FB1?style=flat-square" alt="日本語"></a>
    <a href="https://github.com/cloud-oc/PixTab/blob/main/README.ko.md"><img src="https://img.shields.io/badge/한국어-03C75A?style=flat-square" alt="한국어"></a>
    <a href="https://github.com/cloud-oc/PixTab/blob/main/README.ru.md"><img src="https://img.shields.io/badge/Русский-0057B8?style=flat-square" alt="Русский"></a>
  </p>
</div>

<hr>

<div align="center">
  <img src="icons/icon-128.png" width="100" height="100" alt="PixTab Icon">
  <br>
  <b style="font-size: 36px;">PixTab</b>
  <p>
    <strong>◎ Pixivのイラストをブラウザの新しいタブページに！◎</strong>
  </p>

  <p>
    <a href="https://microsoftedge.microsoft.com/addons/detail/chpabpanagjfnglcpnpdpelacjfpnfoj" style="text-decoration:none;">
      <img src="https://raw.githubusercontent.com/alrra/browser-logos/90fdf03c/src/edge/edge_48x48.png" width="24" height="24" alt="Edge" style="vertical-align: middle; margin-bottom: 2px;"> Edge
    </a>
    &nbsp;&nbsp;&nbsp;
    <a href="https://addons.mozilla.org/firefox/addon/pixtab/" style="text-decoration:none;">
      <img src="https://raw.githubusercontent.com/alrra/browser-logos/90fdf03c/src/firefox/firefox_48x48.png" width="24" height="24" alt="Firefox" style="vertical-align: middle; margin-bottom: 2px;"> Firefox
    </a>
  </p>
</div>

<br>

## 📖 概要

**PixTab** は、新しいタブページに Pixiv のイラストを表示する軽量で美しいブラウザ拡張機能です。カスタム設定、キーワード検索、ローカリゼーションをサポートし、Chromium 系および Firefox 系ブラウザで快適に動作します。(✿◡‿◡)

## ✨ 主な機能

- 🎨 **美しいイラスト** — 新しいタブを開くたびに、厳選された Pixiv のアートワークに出会えます。

<!-- (Skipping lines) -->


- 📊 **多彩なランキング** — デイリー、ウィークリー、マンスリー、ルーキー、オリジナル、人気順などに対応！
- 🔍 **キーワード検索** — AND、OR、NOT 検索を組み合わせて、好みの作品をピンポイントで見つけます。
- 🔖 **ブックマーク数フィルタ** — ブックマーク数の最小/最大値を設定して、人気作品のみを表示。
- 👤 **イラストレーター指定** — イラストレーター ID で絞り込み、特定のクリエイターの作品のみを表示。
- ⭐ **フォロー中のイラストレーター** — Pixiv でフォローしているイラストレーターの最新作品を表示。
- 💝 **ブックマーク作品** — Pixiv でブックマークしたイラストを閲覧。
- ✨ **おすすめ作品** — Pixiv があなたにおすすめするパーソナライズされたコンテンツを表示。
- 🔐 **ログイン対応** — Pixiv アカウントにログインして、パーソナライズ機能を利用可能。
- 🖼️ **タイプフィルタ** — イラスト、マンガ、うごイラ (Ugoira) の選択、または AI 生成作品の非表示が可能。
- 📏 **画質管理** — 最小幅/高さを設定して、高画質な画像のみを表示。
- 🛠️ **カスタマイズ** — 画像サイズ、配置、タイルモードを自由に調整可能。
- 🌓 **テーマ同期** — システム時間に合わせて、ダーク/ライトテーマを自動的に切り替えます。
- 🌍 **多言語対応** — 英語、簡体字中国語、繁体字中国語、日本語、韓国語、ロシア語に対応。
- 🛡️ **プライバシー優先** — すべての設定はローカルに保存され、外部サーバーへデータを送信することはありません。

## 📦 オフラインインストール

> **注意**：この拡張機能は Chrome ウェブストアには掲載されていません。Chrome ユーザーは以下の手順で手動インストールしてください。

<details>
<summary><strong>📥 Chromium 系ブラウザ (Chrome, Edge, Brave...)</strong></summary>

1. このリポジトリをクローンまたはダウンロードします。
2. ブラウザのアドレスバーに `chrome://extensions` と入力して開きます。
3. 右上の **デベロッパーモード** (Developer mode) を有効にします。
4. **方法 A — パッケージ版 (ZIP) をインストール (推奨):**
    - `dist/` ディレクトリ内のリリースパッケージ (例: `dist/pixtab-0.9-chrome.zip`) をダウンロードした場合、その `.zip` ファイルを拡張機能管理ページにドラッグ＆ドロップしてみてください。
    - ドラッグ＆ドロップが機能しない場合は、ZIP を解凍し、**パッケージ化されていない拡張機能を読み込む** (Load unpacked) をクリックして、解凍したフォルダを選択します。
5. **方法 B — ソースからインストール (開発者向け):**
    - **パッケージ化されていない拡張機能を読み込む** をクリックし、プロジェクトのルートディレクトリを選択します。
6. 新しいタブを開いて、PixTab をお楽しみください！✨
</details>

<details>
<summary><strong>🦊 Firefox 系ブラウザ (140+)</strong></summary>

1. このリポジトリをクローンまたはダウンロードします。
2. Firefox 140 以降を使用し、`about:debugging#/runtime/this-firefox` にアクセスします。
3. **一時的なアドオンを読み込む...** (Load Temporary Add-on) をクリックします。
4. **方法 A — XPI パッケージをインストール (テスト用):**
    - リリースパッケージ `dist/*.xpi` (例: `dist/pixtab-0.9-firefox.xpi`) をダウンロードした場合、`about:addons` を開き、歯車アイコン ⚙️ → **ファイルからアドオンをインストール...** を選択するか、`.xpi` ファイルをページにドラッグします。
5. **方法 B — 一時的な読み込み (開発者向け):**
    - **一時的なアドオンを読み込む...** をクリックし、プロジェクトディレクトリ内の `manifest.json` ファイルを選択します。
6. 新しいタブを開いて、PixTab をお楽しみください！✨

> *ヒント*: Firefox で一時的に読み込まれた拡張機能は、ブラウザを再起動すると削除されます。
</details>

## 🎐 ネットワーク要件

この拡張機能は、Pixiv (`pixiv.net` および `pximg.net`) にアクセスしてデータを取得する必要があります。
> 新しいタブページでロードアニメーションが止まらない場合、ネットワークが Pixiv に接続できていない可能性があります。ネットワーク接続やプロキシ設定をご確認ください。この拡張機能はプロキシ機能を**提供しません**。

## 📜 ライセンス

詳細は [LICENSE](LICENSE) ファイルをご覧ください。

## 🤝 貢献と参加

Issue や PR の送信は大歓迎です！貢献ガイドラインについては [CONTRIBUTING.md](CONTRIBUTING.md) をご覧ください。

## 💖 サポート & 寄付

PixTab を気に入っていただけたら、サポートや寄付をいただけると大変励みになります。あなたの応援が開発の原動力です！(╹▽╹)

- [Afdian (爱发电)](https://afdian.com/a/cloud09)
- [Patreon](https://www.patreon.com/cloud09_official)

## 🌟 謝辞

このプロジェクトは以下のプロジェクトにインスパイアされました：
- [HumbleNewTabPage](https://github.com/ibillingsley/HumbleNewTabPage)
- [PixivforMuzei3](https://github.com/yellowbluesky/PixivforMuzei3)
