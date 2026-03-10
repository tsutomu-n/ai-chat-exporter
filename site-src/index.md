# AI Chat Export Assets

GitHub Pages 公開用ディレクトリ `docs/` の編集元です。

## Files

- `ai-chat-export.min.js`
  - ブラウザが読み込む本体JS
- `../ai-chat-export.github-pages.oneliner.js`
  - `script src` 型の短いローダーブックマークレット
- `../ai-chat-export.github-pages.fetch-loader.oneliner.js`
  - `fetch + eval` 型の代替ローダーブックマークレット
- `../sync_docs_assets.sh`
  - `docs/ai-chat-export.min.js` を同期する補助スクリプト
- `../sync_site_docs.sh`
  - `site-src/*.md` を `docs/` に同期する補助スクリプト

## Docs

- [README.ja.md](./README.ja.md)
- [github-pages-setup.ja.md](./github-pages-setup.ja.md)
- [bookmarklet-loader.ja.md](./bookmarklet-loader.ja.md)

## Publish URL

GitHub Pages を `main` ブランチの `/docs` から公開した場合、本体URLは次になります。

`https://tsutomu-n.github.io/ai-chat-exporter/ai-chat-export.min.js`

注意:

- リポジトリ名や所有者が違う場合、このURLは変わります
- fork した場合はローダー内のURLも合わせて変更してください
