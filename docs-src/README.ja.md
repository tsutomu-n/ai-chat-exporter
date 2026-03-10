# AI Chat Export 使い方ガイド

## 最初に使うべきファイル

- `./ai-chat-export.public.oneliner.js`
  - 第一推奨。自己完結型のブックマークレット
- `./ai-chat-export.public.min.js`
  - Console / Snippets 用

この2つは外部 `fetch` や外部 `script src` に依存しないため、ChatGPT のように CSP が厳しいサイトでも動きやすいです。

## 推奨する使う順番

1. `public.oneliner`
2. `public.min.js`
3. GitHub Pages ローダー

## 最短手順

1. `ai-chat-export.public.oneliner.js` を開く
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
