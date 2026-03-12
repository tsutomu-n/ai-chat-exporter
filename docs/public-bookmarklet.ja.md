# ブックマークレットの使い方

## 最初に使うファイル

- `./ai-chat-export.chatgpt-claude.bookmarklet.oneliner.js`
- `./ai-chat-export.aistudio-grok.bookmarklet.oneliner.js`
- `./ai-chat-export.claude.bookmarklet.oneliner.js`

通常はこの分割版が第一推奨です。ブックマーク編集欄に保存しやすい長さを優先しています。統合版を 1 本で使いたい場合は、結果確認 UI を軽くした `./ai-chat-export.unified.bookmarklet.oneliner.js` を先に試してください。過去の高機能版や派生版は repository 側の `archive/README.ja.md` にまとめています。

## 使い方

1. 対応サイトに合うファイルを開く
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
