# AIチャット書き出し

ChatGPT / Grok / Google AI Studio などの会話を、Markdown / JSON / プレーンテキストとして保存するブックマークレットです。

## 最初に使うファイル

- `ai-chat-export.public.oneliner.js`
  - 第一推奨。自己完結型のブックマークレット

初心者向けに `root` に残してあるのはこの1本だけです。外部 `fetch` や外部 `script src` を使わないため、ChatGPT のように CSP が厳しいサイトでも動きやすいです。

## 最短手順

1. `ai-chat-export.public.oneliner.js` を開く
2. 中身を全部コピーして、ブラウザのブックマーク URL 欄へ貼る
3. ChatGPT / Grok / Google AI Studio の会話ページで実行する

## 対応サイト

- `chatgpt.com` / `*.chatgpt.com` / `chat.openai.com`
- `grok` を含むドメイン
- `x.com/i/grok` / `twitter.com/i/grok`
- `aistudio.google.com` / `*.aistudio.google.com`
- `claude` / `gemini` / `deepseek` を含む一部ドメイン

## 開発者向けの配置

- `dist/ai-chat-export.public.min.js`
  - Console / Snippets 用
- `dist/ai-chat-export.min.js`
  - GitHub Pages 配信用の本体JS
- `dist/ai-chat-export.oneliner.js`
  - 通常版ワンライナー
- `loaders/ai-chat-export.github-pages.oneliner.js`
  - GitHub Pages の `script src` ローダー版
- `loaders/ai-chat-export.github-pages.fetch-loader.oneliner.js`
  - GitHub Pages の `fetch + eval` ローダー版
- `src/ai-chat-export.js`
  - 可読ソース

## 詳細ドキュメント

- `docs/public-bookmarklet.ja.md`
- `docs/bookmarklet-loader.ja.md`
- `docs/github-pages-setup.ja.md`
- `docs/codex-cli-frontend-setup.ja.md`

## 画面キャプチャ

README には詳細画像を置かず、`assets/` にまとめます。

- 画像の置き場所: `assets/screenshots/`
- 撮るべき画像の一覧: `assets/README.ja.md`

おすすめの画像は次です。

1. [ブックマーク編集画面](assets/screenshots/01-bookmark-edit.png)
2. [実行前の設定ダイアログ](assets/screenshots/02-config-dialog.png)
3. [`ていねい` 実行中の進捗ダイアログ](assets/screenshots/03-careful-progress.png)
4. [品質確認ダイアログ](assets/screenshots/04-quality-dialog.png)
5. [保存された Markdown の例](assets/screenshots/05-exported-markdown.png)

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

MIT
