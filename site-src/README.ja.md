# AI Chat Export 使い方ガイド

この `site-src/` ディレクトリは、公開用説明文書の編集元です。

公開時には `site-src/` の Markdown を `docs/` へ同期します。

## 最初に使うべきファイル

- `../ai-chat-export.public.oneliner.js`
  - 第一推奨。自己完結型のブックマークレット
- `../ai-chat-export.public.min.js`
  - Console / Snippets 用

この2つは外部 `fetch` や外部 `script src` に依存しないため、ChatGPT のように CSP が厳しいサイトでも動きやすいです。

## 使うファイル

- `../ai-chat-export.public.oneliner.js`
  - 推奨。自己完結型ブックマークレット
- `../ai-chat-export.public.min.js`
  - 推奨。Console / Snippets 用
- `../ai-chat-export.min.js`
  - 通常 minified 本体
- `../ai-chat-export.github-pages.oneliner.js`
  - 補助。`script src` 方式ローダー
- `../ai-chat-export.github-pages.fetch-loader.oneliner.js`
  - 補助。`fetch + eval` 方式ローダー
- `../sync_docs_assets.sh`
  - `docs/` 配信用JSを同期するスクリプト
- `../sync_site_docs.sh`
  - `site-src/` の文書を `docs/` に同期するスクリプト

## 推奨する使う順番

1. `public.oneliner`
2. `public.min.js`
3. GitHub Pages ローダー

## 最短手順

1. GitHub にこのリポジトリを push する
2. `ai-chat-export.public.oneliner.js` の1行をブックマークへ貼る
3. ChatGPT / Grok / AI Studio で実行確認する
4. 必要なら `ai-chat-export.public.min.js` を Console / Snippets でも使う
5. GitHub Pages は補助用途として設定する

## 詳しい手順

- [public-bookmarklet.ja.md](./public-bookmarklet.ja.md)
- [bookmarklet-loader.ja.md](./bookmarklet-loader.ja.md)
- [github-pages-setup.ja.md](./github-pages-setup.ja.md)
