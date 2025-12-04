# PixTab <img src="icons/icon-128.png" width="36" height="36" align="right" alt="icon">

<a href="README.md"><img src="https://img.shields.io/badge/English-blue?style=for-the-badge" alt="English"></a> <a href="README.zh.md"><img src="https://img.shields.io/badge/中文-red?style=for-the-badge" alt="中文"></a> <a href="README.ja.md"><img src="https://img.shields.io/badge/日本語-green?style=for-the-badge" alt="日本語"></a>

Chromium ブラウザの新しいタブに Pixiv の素敵なイラストを表示します。

## 概要

PixTab は新しいタブに Pixiv のイラストを表示する軽量な Chrome/Chromium 拡張機能です。カスタム設定、キーワード検索、多言語対応をサポートしています。

## 主な機能

- **美しい Pixiv イラスト** — 新しいタブを開くたびに Pixiv の作品を楽しめます。
- **多彩なソート** — デイリー/ウィークリー/マンスリーランキング、ルーキー、オリジナル、人気順など。
- **キーワード検索** — AND、OR、NOT を組み合わせてタグで作品をフィルタリング。
- **ブックマーク数フィルター** — 最小/最大ブックマーク数を設定して人気度で絞り込み。
- **作品タイプフィルター** — イラスト、マンガ、うごイラを選択、または AI 生成作品を非表示。
- **解像度設定** — 最小幅/高さを設定して画質を確保。
- **表示カスタマイズ** — 画像サイズ、配置、タイリングモードをカスタマイズ。
- **ライト & ダークテーマ** — システム時間に合わせてテーマが自動切り替え。
- **多言語対応** — English、中文、日本語 に対応。
- **プライバシー重視** — すべての設定はローカルに保存、外部サーバーへのデータ送信なし。

## インストール方法

> **注意**：この拡張機能は Chrome Web Store には公開されていません。以下の手順で手動インストールしてください。

1. このリポジトリをクローンまたはダウンロードします。
2. ブラウザで `chrome://extensions` を開きます。
3. **デベロッパーモード** を有効にします。
4. **パッケージ化されていない拡張機能を読み込む** をクリックし、プロジェクトフォルダを選択します。
5. 新しいタブを開くと PixTab が表示されます！

## ネットワーク要件

この拡張機能は Pixiv（`pixiv.net` および `pximg.net`）へのアクセスが必要です。

新しいタブがローディングアニメーションのまま止まっている場合、ネットワークが Pixiv にアクセスできないことを意味します。ネットワークの問題はご自身で解決してください。この拡張機能はプロキシ機能を提供していません。

## ライセンス

詳細は [LICENSE](LICENSE) ファイルをご覧ください。

## 謝辞

このプロジェクトは以下からインスピレーションを受けました：

- [HumbleNewTabPage](https://github.com/ibillingsley/HumbleNewTabPage)
- [PixivforMuzei3](https://github.com/yellowbluesky/PixivforMuzei3)
