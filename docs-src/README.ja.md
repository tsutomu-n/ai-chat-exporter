# AI Chat Export 使い方ガイド

## 最初に使うべきファイル

- `./ai-chat-export.bookmarklet.oneliner.js`
  - 第一推奨。短いブックマークレット
- `./ai-chat-export.public.oneliner.js`
  - 高機能な自己完結型ブックマークレット
- `./ai-chat-export.public.min.js`
  - Console / Snippets 用

`./ai-chat-export.bookmarklet.oneliner.js` は短い bookmarklet 向けの既定版です。`./ai-chat-export.public.oneliner.js` は結果確認ダイアログを含む高機能版です。どちらも外部 `fetch` や外部 `script src` に依存しないため、ChatGPT のように CSP が厳しいサイトでも動きやすいです。

## 推奨する使う順番

1. `bookmarklet.oneliner`
2. `public.oneliner`
3. `public.min.js`
4. GitHub Pages ローダー

## 最短手順

1. `ai-chat-export.bookmarklet.oneliner.js` を開く
2. 中身を全部コピーして、ブラウザのブックマーク URL 欄へ貼る
3. ChatGPT / Grok / Google AI Studio の会話ページで実行する

## 補助ファイル

- `./ai-chat-export.github-pages.oneliner.js`
  - GitHub Pages の `script src` ローダー
- `./ai-chat-export.github-pages.fetch-loader.oneliner.js`
  - GitHub Pages の `fetch + eval` ローダー

## 詳細ドキュメント

- [public-bookmarklet.ja.md](./public-bookmarklet.ja.md)
- [bookmarklet-loader.ja.md](./bookmarklet-loader.ja.md)
- [github-pages-setup.ja.md](./github-pages-setup.ja.md)
