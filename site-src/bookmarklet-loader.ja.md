# ローダーブックマークレットの使い方

## 目的

長い本体コードをブックマークへ直接貼るのではなく、短いローダーだけをブックマークに入れます。

## 使うファイル

- `../ai-chat-export.github-pages.oneliner.js`
  - `script src` 方式
- `../ai-chat-export.github-pages.fetch-loader.oneliner.js`
  - `fetch + eval` 方式の代替

これらのファイルの中身は短い1行です。

役割:

1. GitHub Pages 上の `ai-chat-export.min.js` を読む
2. そのJSを対象ページで実行する

## どちらを使うべきか

### 1. `script src` 方式

使うファイル:

- `../ai-chat-export.github-pages.oneliner.js`

特徴:

- 一般的で軽い
- サイトの `script-src` 制約で止まることがある

### 2. `fetch + eval` 方式

使うファイル:

- `../ai-chat-export.github-pages.fetch-loader.oneliner.js`

特徴:

- `script src` が止まるサイトで動くことがある
- `connect-src` や `unsafe-eval` 制約で止まることがある

最初は `script src` 方式を試してください。
だめなら `fetch + eval` 方式を試してください。

## 登録方法

1. `ai-chat-export.github-pages.oneliner.js` を開く
2. 中身を全部コピーする
3. ブラウザで新しいブックマークを作る
4. 名前は分かりやすく `AI Chat Export Loader` などにする
5. URL 欄へコピーした1行をそのまま貼る
6. 保存する

## 確認ポイント

- 先頭が `javascript:(()=>` で始まっている
- 途中に改行が入っていない
- 末尾が `appendChild(s)})()` で終わっている

## 実行方法

1. ChatGPT / Grok / AI Studio の会話ページを開く
2. ブックマークをクリックする
3. 設定ダイアログが出れば成功

## 動かない時の切り分け

### 1. クリックしても何も起きない

確認:

- DevTools Console にエラーが出ていないか
- `ai-chat-export.min.js` の公開URLを直接開けるか
- ブックマークレットのURL欄が途中で切れていないか

### 2. Console にはエラーが出る

よくある原因:

- 404 で本体JSが取れていない
- CSP で外部 script の読み込みが止められている
- `fetch + eval` 方式では `connect-src` または `unsafe-eval` で止められている

### 3. ブックマークのURL欄でまた切れる

このローダーは短いので、本体直貼りよりかなり安全です。
それでも切れる場合は、URL欄へ貼った後に保存前でもう一度開いて全文が残っているか見てください。

## 代替手段

もし両方のローダー方式が止まる場合は、次の方法で使えます。

1. DevTools Console に `ai-chat-export.min.js` を貼って実行
2. DevTools Snippets に登録して実行

## メモ

ローダー方式は、ブックマークレットの「長すぎて保存できない」問題を避けるための方式です。
本体の機能変更は `ai-chat-export.min.js` 側で管理します。
