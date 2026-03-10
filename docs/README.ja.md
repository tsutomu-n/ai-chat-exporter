# GitHub Pages 公開ガイド

この `site-src/` ディレクトリは、GitHub Pages に公開する説明文書の編集元です。

公開時には `site-src/` の Markdown を `docs/` へ同期します。

## この方式を使う理由

通常のブックマークレットは URL が長すぎると、ブラウザのブックマーク編集画面で途中で切れることがあります。

そこで次の構成を使います。

1. ブックマークには短いローダーだけ入れる
2. ローダーが GitHub Pages 上の `ai-chat-export.min.js` を読み込む
3. 読み込んだ本体JSが対象ページで動く

## 使うファイル

- `../ai-chat-export.min.js`
  - 公開する本体JSの元
- `../ai-chat-export.github-pages.oneliner.js`
  - `script src` 方式の短いローダー
- `../ai-chat-export.github-pages.fetch-loader.oneliner.js`
  - `fetch + eval` 方式の代替ローダー
- `../sync_docs_assets.sh`
  - `docs/` 配信用JSを同期するスクリプト
- `../sync_site_docs.sh`
  - `site-src/` の文書を `docs/` に同期するスクリプト

## 最短手順

1. GitHub にこのリポジトリを push する
2. GitHub のリポジトリ設定で Pages を有効化する
3. 公開URLで `ai-chat-export.min.js` が見えることを確認する
4. `ai-chat-export.github-pages.oneliner.js` の1行をブックマークへ貼る
5. ChatGPT / Grok / AI Studio で実行確認する

動かない場合:

1. まず `script src` 方式を試す
2. だめなら `fetch + eval` 方式を試す
3. どちらもだめなら Console / Snippets に切り替える

詳しい手順は次を読んでください。

- [github-pages-setup.ja.md](./github-pages-setup.ja.md)
- [bookmarklet-loader.ja.md](./bookmarklet-loader.ja.md)
