---
name: frontend-debug
description: Use this skill when the user asks for frontend debugging, browser investigation, console or network inspection, performance triage, or reproducing a UI bug in a live page. Prefer this skill before writing Playwright coverage when the issue is not yet understood.
---

# Frontend Debug

## Use This Skill For

- 画面で今起きている不具合のライブ調査
- console error、network failure、DOM state の確認
- 既存の Chrome を使ったログイン済み状態の検証
- パフォーマンスや rendering の初動調査

## Workflow

1. まず対象ページ、再現条件、期待結果を短く整理する。
2. `Chrome DevTools MCP` を使って、Elements、Console、Network、Performance を確認する。
3. ログインや手操作が必要な場合は、既存の Chrome に接続して状態を引き継ぐ。
4. 原因候補を 1 つずつ絞り、再現手順をテキストで残す。
5. 修正後に回帰防止が必要なら `Playwright` の再現テスト作成へ切り替える。

## Rules

- 問題の理解前に Playwright を先に量産しない。
- 調査結果には再現手順、観測結果、仮説、次の検証を含める。
- network や performance の異常は、症状だけでなく発生条件も記録する。
- 修正が確定したら、必要に応じて `frontend-e2e` skill を使って再現テストへ落とし込む。
