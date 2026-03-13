# AI Chat Export 使い方ガイド

## 最初に使うべきファイル

- `./ai-chat-export.chrome.bookmarklet.oneliner.js`
  - Chrome / Chromium 系で使う統合版
- `./ai-chat-export.firefox.bookmarklet.oneliner.js`
  - Firefox で使う軽量統合版

Chrome / Chromium 系では `./ai-chat-export.chrome.bookmarklet.oneliner.js`、Firefox では `./ai-chat-export.firefox.bookmarklet.oneliner.js` を使う前提に整理しています。公開リポジトリではこの 2 ファイルだけを配布対象にしています。

## 最短手順

1. ブラウザに応じて `ai-chat-export.chrome.bookmarklet.oneliner.js` または `ai-chat-export.firefox.bookmarklet.oneliner.js` を開く
2. 中身を全部コピーして、ブラウザのブックマーク URL 欄へ貼る
3. 対応サイトの会話ページで実行する

## この `docs/` にあるもの

- `ai-chat-export.chrome.bookmarklet.oneliner.js`
- `ai-chat-export.firefox.bookmarklet.oneliner.js`
- `index.md`

この `docs/` には、公開用のブックマークレット本体と最小ガイドだけを置いています。

## ソースと配布物の関係

- `src/ai-chat-export.js`
  - 生成元の可読ソース
- `ai-chat-export.chrome.bookmarklet.oneliner.js`
  - Chrome / Chromium 向けの配布用 bookmarklet
- `ai-chat-export.firefox.bookmarklet.oneliner.js`
  - Firefox 向けの配布用 bookmarklet

配布用ファイルは `scripts/generate_oneline_bookmarklet.sh` で再生成します。
