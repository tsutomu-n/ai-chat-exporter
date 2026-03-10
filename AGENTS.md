# Repository Codex Rules

このリポジトリでフロントエンド調査やテストを行うときは、まず `Read Only` で構成と既存テストを確認する。

## Tool Priority

1. 仕様や公式 API の確認は、利用可能なら docs 系 MCP を使う。
2. ライブ調査は `Chrome DevTools MCP` を優先する。
3. 回帰防止や再現テストの固定は `Playwright` を使う。

## Frontend Workflow

- まず `Chrome DevTools MCP` でライブ調査を行い、DOM、console、network、performance を確認する。
- 既存の Chrome で再現できる不具合は、新規ブラウザ起動より既存の Chrome 接続を優先する。
- 原因が絞れたら、再現手順を `Playwright` の再現テストへ落とし込む。
- `Playwright` では `getByRole` などの user-facing locator を優先し、`web-first assertions` を使う。
- 一時調査だけで終わらせず、バグ修正時は再現テストまたは回帰テストを追加する。

## Skills

- ライブ調査は `.agents/skills/frontend-debug` を使う。
- 再現テストと回帰防止は `.agents/skills/frontend-e2e` を使う。
- 迷った場合は `ライブ調査 -> 再現テスト -> 修正 -> 再実行` の順に進める。
