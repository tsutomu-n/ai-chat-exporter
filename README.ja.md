# AIチャット書き出し

Claude / ChatGPT / Grok / Google AI Studio などの会話を、ブラウザ上でそのまま保存するためのブックマークレットです。

## このツールの目的

長い AI チャットは、あとで読み返したり整理したりする時に扱いづらくなりがちです。無限スクロール、折りたたまれた本文、コピー漏れが障害になります。

このツールは、会話をできるだけ壊れにくく回収し、ローカルへ保存しやすい形にするためのものです。

- 長い AI チャットをまとめて取得する
- ユーザー発言とモデル応答を読みやすく並べる
- Markdown / プレーンテキストへ変換する
- 保存前に品質判定を見て、取りこぼしの可能性を確認する

## 主な機能

- ブックマークレットとして実行でき、常駐拡張が不要
- Claude / ChatGPT / Grok / Google AI Studio 向けの専用アダプタを内蔵
- 長い会話を上端・下端までたどる自動スクロール
- `続きを読む` / `Show more` などの展開ボタンを自動クリック
- `Markdown` / `プレーンテキスト` の 2 形式で出力
- 保存前の品質判定
- ファイル保存とクリップボード保存の両対応
- 実行モードや出力形式を `localStorage` に保存

## おすすめファイル

- `ai-chat-export.chrome.bookmarklet.oneliner.js`
  - Chrome / Chromium 系ブラウザ向けの統合版
- `ai-chat-export.firefox.bookmarklet.oneliner.js`
  - Firefox 向けの軽量統合版
  - 結果確認 UI を絞ってブックマーク保存しやすくした版

## 使い方のイメージ

### ブックマーク登録

![ブックマーク登録画面](assets/01-bookmark-setup.png)

Chrome のブックマーク URL 欄にワンライナーを貼り付けて使います。

### 実行設定

![実行設定ダイアログ](assets/02-config-dialog.png)

実行前に速度や保存形式を選べます。

### 出力結果

![出力結果の確認ダイアログ](assets/03-export-result.png)

長い会話でも読みやすい Markdown として保存できます。

## 最短手順

1. Chrome / Chromium 系では `ai-chat-export.chrome.bookmarklet.oneliner.js`、Firefox では `ai-chat-export.firefox.bookmarklet.oneliner.js` を開く
2. 中身を全部コピーして、ブラウザのブックマーク URL 欄へ貼る
3. 対応サイトの会話ページで実行する
4. 設定ダイアログで実行モードと保存形式を選ぶ
5. 品質判定を見て保存する

## どんな保存に向いているか

- あとで Markdown として読み返したい会話
- プレーンテキストで軽く共有したい会話
- 長くて手動コピーだと抜けや重複が出やすい会話

## 出力形式

- `Markdown`
  - 普通の `.md` として扱いやすい形式
- `プレーンテキスト`
  - Markdown 記法を極力落とした軽量形式

プレーンテキストでは、ヘッダ付きと本文のみの切り替えもできます。

## 実行モード

- `はやい`
  - 短い会話向け
- `ふつう`
  - 既定値。普段使い向け
- `ていねい`
  - 長い会話向け。追い込みを強める

## 品質確認

保存前に `PASS` / `WARN` / `FAIL` を表示し、品質判定を確認できます。長い会話で `WARN` や `FAIL` が出た場合は、`ていねい` モードでの再実行が有効です。

## 対応サイト

- `chatgpt.com` / `chat.openai.com`
- `claude.ai`
- Grok 系ドメインと `x.com/i/grok`
- `aistudio.google.com`
- 一部の `gemini` / `deepseek` 系ドメイン

## このリポジトリの見方

- `ai-chat-export.chrome.bookmarklet.oneliner.js`
  - Chrome / Chromium 系向けの ASCII ベース統合版
- `ai-chat-export.firefox.bookmarklet.oneliner.js`
  - Firefox 向けの ASCII ベース軽量統合版
  - 結果確認 UI を削って短くした版
- `src/ai-chat-export.js`
  - 可読ソース

## 詳細ドキュメント

- `docs/README.ja.md`

## 開発メモ

ワンライナー再生成:

```bash
bash scripts/generate_oneline_bookmarklet.sh
```

`docs/` 同期:

```bash
bash scripts/sync_docs_assets.sh
bash scripts/sync_site_docs.sh
```

## ライセンス

Apache License 2.0
