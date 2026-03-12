# assets ガイド

このディレクトリには README や docs から参照する画像や補助素材を置きます。

## 推奨構成

```text
assets/
├── README.ja.md
└── screenshots/
    ├── 01-bookmark-edit.png
    ├── 02-config-dialog.png
    ├── 03-careful-progress.png
    ├── 04-quality-dialog.png
    └── 05-exported-markdown.png
```

初期状態では、`screenshots/` に仮のプレースホルダ画像を置いています。
実際の画面キャプチャを用意したら、同じファイル名で上書きしてください。

## 撮ると良い画像

1. `01-bookmark-edit.png`
   - ブックマーク編集画面
   - URL 欄へ `ai-chat-export.bookmarklet.oneliner.js` を貼る場面

2. `02-config-dialog.png`
   - 実行前の設定ダイアログ
   - `ていねい` などのプリセットが見える状態

3. `03-careful-progress.png`
   - `ていねい` 実行中の進捗ダイアログ
   - 「先頭追い込み中…」や件数が見える状態

4. `04-quality-dialog.png`
   - 結果の品質確認ダイアログ
   - 件数、判定、プレビューが見える状態

5. `05-exported-markdown.png`
   - 保存された Markdown の例
   - 出力結果の見本として使う

## 撮影時のコツ

- PNG を推奨
- 余計なブラウザUIはできるだけ切る
- 文字が読める解像度にする
- 個人名、会話本文、機密情報がある場合は隠す
- 強調したい部分が分かるように、1画像1テーマにする

## README に向く画像

- 1枚目だけ載せるなら `02-config-dialog.png` か `04-quality-dialog.png`
- README では多くても 1 〜 2 枚に抑える
- 詳しい画面説明は docs に回す
