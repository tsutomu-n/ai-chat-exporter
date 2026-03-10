# AIチャット書き出し

ChatGPT / Grok / Google AI Studio などの会話を、Markdown / JSON として保存するブックマークレットです。

## まず使うファイル

- `ai-chat-export.public.oneliner.js`
  - 第一推奨。自己完結型のブックマークレット
- `ai-chat-export.public.min.js`
  - DevTools Console / Snippets 用

`public` 版は外部 `fetch` や外部 `script src` を使わないため、ChatGPT のように CSP が厳しいサイトでも動きやすいです。

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

## ファイルの使い分け

- `ai-chat-export.public.oneliner.js`
  - 配布向け。自己完結型のブックマークレット
- `ai-chat-export.public.min.js`
  - Console / Snippets 用
- `ai-chat-export.oneliner.js`
  - 通常版ワンライナー
- `ai-chat-export.github-pages.oneliner.js`
  - GitHub Pages ローダー版
- `ai-chat-export.js`
  - 可読ソース

## 詳細ドキュメント

- `docs/public-bookmarklet.ja.md`
- `docs/bookmarklet-loader.ja.md`
- `docs/github-pages-setup.ja.md`

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
./generate_oneline_bookmarklet.sh
```

`docs/` 同期:

```bash
./sync_docs_assets.sh
./sync_site_docs.sh
```

## ライセンス

MIT
