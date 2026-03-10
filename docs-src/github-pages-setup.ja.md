# GitHub Pages 設定手順

対象読者: GitHub Pages を初めて使う人

## 目的

このリポジトリの `docs/` ディレクトリを、そのまま Web 公開します。

公開できると、次の URL で本体JSを配信できます。

`https://tsutomu-n.github.io/ai-chat-exporter/ai-chat-export.min.js`

## 前提

- GitHub リポジトリが存在する
- `main` ブランチへ push できる
- このリポジトリ名が `ai-chat-exporter` である

もし次が違う場合は、ローダーファイル内のURLも変更してください。

- GitHub ユーザー名
- リポジトリ名

## 手順

1. GitHub でリポジトリを開く
2. 上部タブから `Settings` を開く
3. 左メニューの `Pages` を開く
4. `Build and deployment` の `Source` を `Deploy from a branch` にする
5. `Branch` を次のように設定する
   - Branch: `main`
   - Folder: `/docs`
6. `Save` を押す
7. 数十秒から数分待つ
8. Pages の公開URLが表示されたら開く

## 確認方法

次の URL を直接開きます。

`https://tsutomu-n.github.io/ai-chat-exporter/ai-chat-export.min.js`

確認ポイント:

- 404 ではない
- HTML ではなく JavaScript の中身が見える
- ファイル先頭が `(async()=>` などのJSで始まる

## よくある失敗

### 1. 404 になる

主な原因:

- Pages がまだ反映されていない
- `main /docs` ではなく別のブランチやフォルダを公開している
- リポジトリ名が想定と違う

確認:

- Pages 設定画面の Branch/Folder
- リポジトリ名

### 2. `index.md` は開くが `ai-chat-export.min.js` がない

主な原因:

- `docs/ai-chat-export.min.js` が push されていない

確認:

- GitHub 上で `docs/ai-chat-export.min.js` が見えるか

### 3. URL は開けるがブックマークレットで動かない

主な原因:

- 対象サイトの CSP が外部 script 読み込みを止めている
- ブックマークのURL欄にローダーを貼る時に文字が欠けた

この場合は [bookmarklet-loader.ja.md](./bookmarklet-loader.ja.md) を読んでください。

## 更新手順

本体を更新したい時は次の順です。

1. `src/ai-chat-export.js` を修正
2. `bash scripts/generate_oneline_bookmarklet.sh` を実行
3. `bash scripts/sync_docs_assets.sh` を実行
4. `bash scripts/sync_site_docs.sh` を実行
5. GitHub に push
6. Pages の反映を待つ

## どこまでやれば完了か

次ができれば完了です。

1. Pages URL が開く
2. `ai-chat-export.min.js` が直接見える
3. ローダーブックマークレットから対象ページで起動できる
