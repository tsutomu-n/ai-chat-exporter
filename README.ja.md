# AIチャット書き出し

ChatGPT / Grok / Google AI Studio などの会話を、ブラウザ上でそのまま保存するためのブックマークレットです。長い AI チャットをあとで読み返したい、ナレッジ化したい、Obsidian や別ツールへ持っていきたい、という用途を想定しています。

## このツールの目的

Web 上の AI チャットは、その場では読めても、あとから整理しづらいことがあります。UI 変更や無限スクロール、途中で折りたたまれた本文、共有しにくい保存形式が障害になります。

このツールは、そうした会話をできるだけ壊れにくい形で回収し、ローカルに残せるようにするためのものです。

- 長い AI チャットをまとめて取得する
- ユーザー発言とモデル応答を読みやすい形で保存する
- Markdown / JSON / プレーンテキストなど、用途に応じた形式へ変換する
- 保存前に品質判定を見て、取りこぼしの可能性を確認できるようにする

## 主な機能

- ブックマークレットとして実行でき、拡張機能の常駐インストールが不要
- ChatGPT / Grok / Google AI Studio 向けの専用アダプタを内蔵
- 長い会話を上端・下端までたどるための自動スクロール
- `続きを読む` / `Show more` などの展開ボタンを自動クリック
- Markdown / プレーンテキスト / Obsidian向け / JSON の 4 形式で出力
- 保存前プレビュー、品質判定、詳細ログ表示
- ファイル保存とクリップボード保存の両対応
- 実行モードや出力形式を `localStorage` に保存し、次回起動時に再利用

## 最初に使うファイル

- `ai-chat-export.bookmarklet.oneliner.js`
  - ブックマーク編集欄向けの第一推奨
  - `variants/ai-chat-export.public.minimal.oneliner.js` と同じ中身
  - 保存形式は `Markdown / プレーンテキスト` の 2 つだけ
  - `保存内容プレビュー` `詳細判定` `手動コピー欄` を外した短い版
- `ai-chat-export.public.oneliner.js`
  - 高機能な自己完結型ブックマークレット
  - 結果確認ダイアログを含む通常版
- `variants/ai-chat-export.public.no-obs.oneliner.js`
  - Obsidian 向け形式を削った軽量版
- `variants/ai-chat-export.public.no-obs.encoded.oneliner.js`
  - ブックマーク保存との相性を優先した bookmark-safe 軽量版

`ai-chat-export.bookmarklet.oneliner.js` は root に置く最短のブックマークレットで、ブックマーク URL 欄が長い文字列を切るブラウザではまずこれを試す構成です。`ai-chat-export.public.oneliner.js` は高機能版として残しています。どちらも外部 `fetch` や外部 `script src` を使わないため、ChatGPT のように CSP が厳しいサイトでも動きやすい構成です。

ブックマーク保存時に URL が切れるブラウザ向けに、より短い `minimal` 版も用意しています。これは `old.js` より短いことを狙った版で、保存形式は `Markdown / プレーンテキスト` の 2 つだけです。

特にブックマークレットとして保存できない場合は、まず `ai-chat-export.bookmarklet.oneliner.js` を試してください。その次に `variants/ai-chat-export.public.no-obs.oneliner.js`、最後に `variants/ai-chat-export.public.no-obs.encoded.oneliner.js` を試す順を推奨します。

## 最短手順

1. `ai-chat-export.bookmarklet.oneliner.js` を開く
2. 中身を全部コピーして、ブラウザのブックマーク URL 欄へ貼る
3. ChatGPT / Grok / Google AI Studio の会話ページで実行する
4. 設定ダイアログで実行モードと出力形式を選ぶ
5. 取得完了後、内容プレビューと品質判定を確認して保存する

## どんな会話の保存に向いているか

- あとで Markdown として読み返したい会話
- Obsidian やメモ管理ツールに取り込みたい会話
- JSON として機械処理したい会話
- プレーンテキストで軽く共有したい会話
- 長くて手動コピーだと抜けや重複が出やすい会話

## 出力形式

- `Markdown`
  - 普通の `.md` として読みやすい形式
- `Obsidian向け`
  - callout を含む、ノート管理向けの Markdown
- `JSON`
  - タイトル、URL、保存日時、品質情報、本文をまとめた機械処理向け形式
- `プレーンテキスト`
  - Markdown 記法を極力落とした軽量形式

プレーンテキストでは、ヘッダ付きと本文のみの切り替えもできます。

## 実行モード

- `はやい`
  - 短い会話向け。最速重視で本文展開は行わない
- `ふつう`
  - 既定値。普段使い向け
- `ていねい`
  - 長い会話向け。上端までの追い込みと展開回数を増やす

会話の長さやサイトの重さに応じて、スクロール回数、待ち時間、自動展開の有無を調整できます。

## 品質確認

保存前に、取得結果の品質を `PASS` / `WARN` / `FAIL` で確認できます。単に保存するだけではなく、次のような情報も見られます。

- 上端まで到達できたか
- 下端まで到達できたか
- 会話数が最後まで安定したか
- 自動で本文を何回展開したか
- 話者判定が弱いメッセージや順序矛盾候補があるか

長い会話で `WARN` や `FAIL` が出た場合は、`ていねい` モードで再実行すると改善することがあります。

## 対応サイト

- `chatgpt.com` / `*.chatgpt.com` / `chat.openai.com`
- `grok` を含むドメイン
- `x.com/i/grok` / `twitter.com/i/grok`
- `aistudio.google.com` / `*.aistudio.google.com`
- `claude` / `gemini` / `deepseek` を含む一部ドメイン

このうち、専用アダプタがあるのは現在 ChatGPT / Grok / Google AI Studio です。それ以外のドメインは、ページ構造次第で取得できないことがあります。

## このリポジトリの見方

- `ai-chat-export.public.oneliner.js`
  - そのままブックマークに貼る公開向けワンライナー
- `dist/ai-chat-export.public.min.js`
  - DevTools Console / Snippets 用
- `dist/ai-chat-export.min.js`
  - GitHub Pages 配信用の本体 JS
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
