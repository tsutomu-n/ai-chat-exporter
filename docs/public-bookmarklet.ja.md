# public 版ブックマークレットの使い方

## 最初に使うファイル

- `../ai-chat-export.public.oneliner.js`

このファイルが、現在の第一推奨です。

理由:

- 自己完結型
- 外部 `fetch` や外部 `script src` がない
- ChatGPT の CSP に止められにくい

## 使い方

1. `ai-chat-export.public.oneliner.js` を開く
2. 中身を全部コピーする
3. ブラウザで新しいブックマークを作る
4. 名前を `AI Chat Export` などにする
5. URL 欄へコピーした1行をそのまま貼る
6. 保存する

## 確認ポイント

- 先頭が `javascript:(async()=>` で始まっている
- 途中に改行が入っていない
- 保存後に URL 欄の末尾まで残っている

## 実行方法

1. ChatGPT / Grok / AI Studio の会話ページを開く
2. ブックマークをクリックする
3. 設定ダイアログが出れば成功

## 動かない時

### 1. 何も起きない

確認:

- 保存した URL が途中で切れていないか
- 先頭が `javascript:` で始まっているか

### 2. Console では動くがブックマークでは動かない

この場合は、ブックマーク保存時に URL が切れている可能性が高いです。

### 3. 代替手段

ブックマークで難しい場合は次を使います。

- `../ai-chat-export.public.min.js`

DevTools の Console か Snippets で使えます。
