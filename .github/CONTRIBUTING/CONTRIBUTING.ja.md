# PixTab への貢献

[English](../../CONTRIBUTING.md) | [简体中文](CONTRIBUTING.zh_CN.md) | [繁體中文](CONTRIBUTING.zh_TW.md) | [한국어](CONTRIBUTING.ko.md) | [Русский](CONTRIBUTING.ru.md)

PixTab に興味を持っていただきありがとうございます！バグ報告、機能リクエスト、コードの改善、翻訳への貢献を歓迎します。

## 前提条件

- **Node.js**: v18+ (v20 推奨)
- **Git**: バージョン管理用
- **ブラウザ**: Chrome, Edge, または Firefox (最新バージョン)

## 開発環境のセットアップ

```bash
# リポジトリをクローン
git clone https://github.com/cloud-oc/PixTab.git
cd PixTab
```

### テストのための拡張機能の読み込み

**Chrome/Edge:**
1. `chrome://extensions` を開きます。
2. **デベロッパー モード**（右上のスイッチ）をオンにします。
3. **パッケージ化されていない拡張機能を読み込む** をクリックし、プロジェクトのルートディレクトリを選択します。
4. 新しいタブを開いて、PixTab の動作を確認します。

**Firefox:**
1. `about:debugging#/runtime/this-firefox` を開きます。
2. **一時的なアドオンを読み込む...** をクリックします。
3. プロジェクトルートにある `manifest.json` を選択します。

## プロジェクト構造

- `manifest.json`: 拡張機能のエントリポイント。
- `src/`: ソースコード。
  - `newtab/`: 新規タブページのロジック。
  - `options/`: 設定パネルのロジック。
  - `background/`: バックグラウンドタスク用サービスワーカー。
  - `shared/`: ユーティリティと共有ロジック。
- `_locales/`: ローカライズ文字列。
- `build/`: ビルドおよびパッケージング用スクリプト。

## 配布用ビルド

Web ストアまたは Firefox AMO 用に拡張機能をパッケージ化する場合：

```bash
# Windows
.\build\build.bat

# macOS/Linux
chmod +x build/build.sh
./build/build.sh
```
出力は `dist/` ディレクトリに生成されます（Git では無視されます）。

## 翻訳の追加

ローカライズファイルは `_locales/{lang}/messages.json` にあります。

1.  ISO 言語コード（例：スペイン語の場合は `es`）を使用して `_locales/` 内に新しいフォルダを作成します。
2.  `_locales/en/messages.json` を新しいフォルダにコピーします。
3.  `"message"` の値のみを翻訳してください。キー名は変更**しないでください**。
4.  ブラウザの语言設定を変更して、拡張機能をテストしてください。

## 変更の送信

1.  **ブランチ作成**: 説明的なブランチを作成します：`git checkout -b feature/cool-feature`。
2.  **テスト**: 変更が Chrome ベースのブラウザと Firefox の両方で動作することを確認してください。
3.  **コミット**: 明確なコミットメッセージを使用してください：`git commit -m "変更の簡単な説明"`。
4.  **プルリクエスト**: 解決した問題や追加した機能の説明を添えて PR を送信してください。

---

質問がありますか？お気軽に Issue を作成してください。PixTab をより良くするためにご協力いただきありがとうございます！
