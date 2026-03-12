# AIチャット書き出し

ChatGPT / Grok / Google AI Studio などの会話を、ブラウザ上でそのまま保存するためのブックマークレットです。

## このツールの目的

長い AI チャットは、あとで読み返したり整理したりする時に扱いづらくなりがちです。無限スクロール、折りたたまれた本文、コピー漏れが障害になります。

このツールは、会話をできるだけ壊れにくく回収し、ローカルへ保存しやすい形にするためのものです。

- 長い AI チャットをまとめて取得する
- ユーザー発言とモデル応答を読みやすく並べる
- Markdown / プレーンテキストへ変換する
- 保存前に品質判定を見て、取りこぼしの可能性を確認する

## 主な機能

- ブックマークレットとして実行でき、常駐拡張が不要
- ChatGPT / Grok / Google AI Studio 向けの専用アダプタを内蔵
- 長い会話を上端・下端までたどる自動スクロール
- `続きを読む` / `Show more` などの展開ボタンを自動クリック
- `Markdown` / `プレーンテキスト` の 2 形式で出力
- 保存前の品質判定
- ファイル保存とクリップボード保存の両対応
- 実行モードや出力形式を `localStorage` に保存

## 最初に使うファイル

- `ai-chat-export.bookmarklet.oneliner.js`
  - 現在の正式な配布物
  - ブックマーク編集欄で保存しやすい短い版
  - 外部 `fetch` や外部 `script src` に依存しない自己完結型

このリポジトリでは、通常利用で必要な JS はこの 1 本だけを前面に置きます。過去の高機能版、派生版、Console 用、ローダー版は [`archive/README.ja.md`](/home/tn/projects/ai-chat-exporter/archive/README.ja.md) に退避しています。

## 最短手順

1. `ai-chat-export.bookmarklet.oneliner.js` を開く
2. 中身を全部コピーして、ブラウザのブックマーク URL 欄へ貼る
3. ChatGPT / Grok / Google AI Studio の会話ページで実行する
4. 設定ダイアログで実行モードと保存形式を選ぶ
5. 品質判定を見て保存する

## どんな保存に向いているか

- あとで Markdown として読み返したい会話
- プレーンテキストで軽く共有したい会話
- 長くて手動コピーだと抜けや重複が出やすい会話

## 出力形式

- `Markdown`
  - 普通の `.md` として扱いやすい形式
- `プレーンテキスト`
  - Markdown 記法を極力落とした軽量形式

プレーンテキストでは、ヘッダ付きと本文のみの切り替えもできます。

## 実行モード

- `はやい`
  - 短い会話向け
- `ふつう`
  - 既定値。普段使い向け
- `ていねい`
  - 長い会話向け。追い込みを強める

## 品質確認

保存前に `PASS` / `WARN` / `FAIL` を表示し、品質判定を確認できます。長い会話で `WARN` や `FAIL` が出た場合は、`ていねい` モードでの再実行が有効です。

## このリポジトリの見方

- `ai-chat-export.bookmarklet.oneliner.js`
  - 現在の配布物
- `src/ai-chat-export.js`
  - 可読ソース
- [`archive/README.ja.md`](/home/tn/projects/ai-chat-exporter/archive/README.ja.md)
  - 過去の派生版、開発用出力、比較用ファイル

## 詳細ドキュメント

- `docs/README.ja.md`
- `docs/public-bookmarklet.ja.md`

## 画面キャプチャ

- 画像の置き場所: `assets/screenshots/`
- 撮るべき画像の一覧: `assets/README.ja.md`

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
