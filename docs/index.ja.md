# AIチャット書き出し 使い方ガイド

[English guide](./index.md) | [中文指南](./index.zh-CN.md)

## 最初に使うべきファイル

- `./ai-chat-export.chrome.bookmarklet.oneliner.js`
  - Chrome / Chromium 系で使う統合版
- `./ai-chat-export.firefox.bookmarklet.oneliner.js`
  - Firefox で使う軽量統合版

Chrome / Chromium 系では `./ai-chat-export.chrome.bookmarklet.oneliner.js`、Firefox では `./ai-chat-export.firefox.bookmarklet.oneliner.js` を使う前提に整理しています。公開リポジトリではこの 2 ファイルだけを配布対象にしています。
配布している bookmarklet は、可読ソース UI にある完全な保存プレビューを省いた compact な結果画面を使っています。Firefox 版はさらに小さくして、Firefox のブックマーク長制限に収めています。
UI と出力ラベルは、日本語 / 英語 / 简体中文で切り替えられます。

## 基本的な使い方

1. ブラウザに応じて `ai-chat-export.chrome.bookmarklet.oneliner.js` または `ai-chat-export.firefox.bookmarklet.oneliner.js` を開く
2. 中身を全部コピーして、ブラウザのブックマーク URL 欄へ貼る
3. 対応サイトの会話ページでブックマークレットを実行する
4. 設定ダイアログで表示言語、実行モード、保存形式を選ぶ
5. 品質判定を確認して、ファイル保存またはクリップボード保存を行う

## 実行モードの違い

- `はやい`
  - 短い会話向けです。取り込みを早めに切り上げます。
- `ふつう`
  - 既定値です。普段使いではまずこれで十分です。
- `ていねい`
  - 長い会話向けです。スクロールや展開の追い込みを強めます。

会話が長い、途中で取りこぼしがありそう、品質判定が `WARN` や `FAIL` になった場合は `ていねい` を使うのが基本です。

## 出力形式の違い

- `Markdown`
  - 見出しや区切りを残した読みやすい形式です。あとで `.md` として読み返したいときに向いています。
- `プレーンテキスト`
  - Markdown 記法を極力落とした軽い形式です。本文だけを共有したいときに向いています。

`プレーンテキスト` では、ヘッダ付きと本文のみの切り替えもできます。

## 品質判定の見方

- `PASS`
  - 大きな問題は見えていません。そのまま保存してよい状態です。
- `WARN`
  - 取りこぼしや差分の大きさが疑われます。まず `ていねい` での再実行を検討します。
- `FAIL`
  - 保存前に再実行した方がよい状態です。長い会話や途中停止が疑われます。

品質判定は、抽出件数や前回との差分をもとに保存前の確認材料として使います。

## 保存方法の違い

- `保存（ファイル）`
  - ローカルにそのまま保存します。あとで読み返す用途に向いています。
- `クリップボード`
  - すぐ貼り付けたいときに向いています。メモアプリやチャットへの転記が楽です。

ブラウザの制限でクリップボードに直接書き込めない場合は、手動コピー用の案内に切り替わります。

## この `docs/` にあるもの

- `ai-chat-export.chrome.bookmarklet.oneliner.js`
- `ai-chat-export.firefox.bookmarklet.oneliner.js`
- `index.md`
- `index.ja.md`
- `index.zh-CN.md`

この `docs/` には、公開用のブックマークレット本体と使い方ガイドだけを置いています。

## ソースと配布物の関係

- `src/ai-chat-export.js`
  - 生成元の可読ソース
- `ai-chat-export.chrome.bookmarklet.oneliner.js`
  - Chrome / Chromium 向けの配布用 bookmarklet
- `ai-chat-export.firefox.bookmarklet.oneliner.js`
  - Firefox 向けの配布用 bookmarklet

配布用ファイルは `scripts/generate_oneline_bookmarklet.sh` で再生成します。
