# ローダーブックマークレットについて

このページは legacy 情報です。

現在の正式な配布物は `./ai-chat-export.bookmarklet.oneliner.js` だけです。GitHub Pages ローダー版は前面導線から外し、repository 側の `archive/README.ja.md` に退避しました。

## 使い分け

- まず使う: `./ai-chat-export.bookmarklet.oneliner.js`
- legacy を参照する時: repository 側の `archive/README.ja.md`

## 補足

ローダー方式は `script src` や `fetch + eval` への CSP 制約を受けやすく、通常利用の第一候補にはしません。
