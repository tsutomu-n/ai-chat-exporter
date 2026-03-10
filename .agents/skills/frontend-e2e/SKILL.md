---
name: frontend-e2e
description: Use this skill when the user asks for Playwright tests, UI regression coverage, deterministic repro cases, or converting a known browser bug into an automated end-to-end test. Prefer this skill after the issue is already understood.
---

# Frontend E2E

## Use This Skill For

- `Playwright` による再現テスト
- UI の回帰防止
- 既知不具合の deterministic な固定
- trace や debug を使った E2E の安定化

## Workflow

1. 既存テストと対象 UI を読み、再現条件を固定する。
2. Red から始め、まず失敗する `Playwright` テストを書く。
3. locator は `getByRole`、`getByLabel`、`getByText`、`getByTestId` を優先する。
4. assertion は `web-first assertions` を使い、即時評価ベースの確認を避ける。
5. flaky な待機を避け、必要なら trace、UI mode、debug で観測する。
6. 実装後に対象テストを再実行し、回帰防止として残す。

## Rules

- 問題の構造が不明なままテストを書かない。必要なら先に `frontend-debug` を使う。
- `page.waitForTimeout()` を常用しない。
- CSS や XPath より user-facing locator を優先する。
- 認証が必要なケースでは状態の使い回しを検討する。
- trace を有効にして失敗時の再調査をしやすくする。
