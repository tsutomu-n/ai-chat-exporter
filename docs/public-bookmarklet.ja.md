# ブックマークレットの使い方

## 最初に使うファイル

- `./ai-chat-export.bookmarklet.oneliner.js`

このファイルが現在の第一推奨です。ブックマーク編集欄に保存しやすい長さを優先し、通常利用で必要な機能だけを残しています。過去の高機能版や派生版は repository 側の `archive/README.ja.md` にまとめています。

## 使い方

1. `ai-chat-export.bookmarklet.oneliner.js` を開く
2. 中身を全部コピーする
3. ブラウザで新しいブックマークを作る
4. URL 欄へ 1 行をそのまま貼る
5. 保存する

## 確認ポイント

- 先頭が `javascript:(async()=>` で始まっている
- 途中に改行が入っていない
- 保存後に URL 欄の末尾まで残っている

## 実行方法

1. ChatGPT / Grok / Google AI Studio の会話ページを開く
2. ブックマークをクリックする
3. 設定ダイアログが出れば成功

## 動かない時

- 保存した URL が途中で切れていないか確認する
- 先頭が `javascript:` で始まっているか確認する
- それでも難しい場合は repository 側の `archive/README.ja.md` にある legacy 配布物を検討する
