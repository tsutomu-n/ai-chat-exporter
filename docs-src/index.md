# AI Chat Export Assets

## Recommended Files

- `./ai-chat-export.public.oneliner.js`
  - 第一推奨。自己完結型ブックマークレット
- `./ai-chat-export.public.min.js`
  - 第一推奨。Console / Snippets 用
- `./ai-chat-export.min.js`
  - GitHub Pages 配信用の本体JS

## Optional Loaders

- `./ai-chat-export.github-pages.oneliner.js`
  - 補助。`script src` 型ローダー
- `./ai-chat-export.github-pages.fetch-loader.oneliner.js`
  - 補助。`fetch + eval` 型ローダー

## Docs

- [README.ja.md](./README.ja.md)
- [public-bookmarklet.ja.md](./public-bookmarklet.ja.md)
- [github-pages-setup.ja.md](./github-pages-setup.ja.md)
- [bookmarklet-loader.ja.md](./bookmarklet-loader.ja.md)

## Recommended Order

1. `public.oneliner`
2. `public.min.js`
3. GitHub Pages ローダー

## GitHub Pages URL

GitHub Pages を `main` ブランチの `/docs` から公開した場合、本体URLは次になります。

`https://tsutomu-n.github.io/ai-chat-exporter/ai-chat-export.min.js`

注意:

- リポジトリ名や所有者が違う場合、このURLは変わります
- fork した場合はローダー内のURLも合わせて変更してください
