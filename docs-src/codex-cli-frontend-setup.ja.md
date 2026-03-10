# Codex CLI フロントエンド開発セットアップ

2026-03-10 時点の、`Codex CLI` でこのリポジトリのフロントエンド調査フローを使うための手順です。記載内容は OpenAI 公式ドキュメントと `chrome-devtools-mcp` 公式 README に基づきます。

## 前提

- `Codex CLI` を使える状態にしておく
- このリポジトリ直下で Codex を起動する

このリポジトリには、リポジトリ内 skill として次が含まれます。

- `.agents/skills/frontend-debug`
- `.agents/skills/frontend-e2e`

OpenAI 公式では、Codex は `SKILL.md` を含む skill をリポジトリの `.agents/skills` から読み取ります。現在の作業ディレクトリからリポジトリ root まで走査されます。

## 1. Chrome DevTools MCP を追加する

Chrome DevTools MCP の公式 README では、Codex CLI 向けの追加コマンドとして次が案内されています。

```bash
codex mcp add chrome-devtools -- npx chrome-devtools-mcp@latest
```

OpenAI 公式では、MCP 設定は通常 `~/.codex/config.toml` に保存され、trusted project ではプロジェクトスコープの `.codex/config.toml` も使えます。

このリポジトリ専用にしたい場合は、プロジェクトスコープの `.codex/config.toml` を使います。

## 2. Codex から認識されているか確認する

Codex CLI の slash commands には `/mcp` があり、設定済み MCP を一覧できます。

セッション内で次を実行します。

```text
/mcp
```

`chrome-devtools` が見えれば、Codex から呼び出せる状態です。

## 3. skill が見えているか確認する

OpenAI 公式では、skill は 2 通りで使われます。

- 明示指定: `/skills` または `$skill-name`
- 暗黙選択: user request が `description` に一致したとき

セッション内で次を実行します。

```text
/skills
```

少なくとも次が見える状態を確認します。

- `frontend-debug`
- `frontend-e2e`

skill の更新は自動検知されますが、OpenAI 公式では反映されない場合は Codex 再起動とされています。

## 4. このリポジトリでの使い分け

- ライブ調査、console、network、performance の確認は `frontend-debug`
- 既知不具合の再現テストや回帰防止は `frontend-e2e`

このリポジトリの [`AGENTS.md`](../AGENTS.md) でも、`Chrome DevTools MCP -> Playwright` の優先順を定義しています。

## 5. 既存 Chrome に接続したい場合

`chrome-devtools-mcp` 公式 README では、実行中の Chrome へ自動接続する方法として `--autoConnect` が案内されています。

例:

```toml
[mcp_servers.chrome-devtools]
command = "npx"
args = ["chrome-devtools-mcp@latest", "--autoConnect"]
```

既存の Chrome へ `--browser-url=http://127.0.0.1:9222` で接続する方法も README にあります。ログイン状態や手動再現を引き継ぎたいときはこちらが向きます。

## 6. まず確認する最小フロー

1. リポジトリ直下で `codex` を起動する
2. `/mcp` で `chrome-devtools` を確認する
3. `/skills` で `frontend-debug` と `frontend-e2e` を確認する
4. ライブ調査なら「この画面を Chrome DevTools MCP で調べて」のように依頼する
5. 再現テストなら「この不具合を Playwright で固定して」のように依頼する

## Sources

- OpenAI Codex MCP: https://developers.openai.com/codex/mcp
- OpenAI Codex Skills: https://developers.openai.com/codex/skills
- OpenAI Codex CLI Slash Commands: https://developers.openai.com/codex/cli/slash-commands
- Chrome DevTools MCP README: https://github.com/ChromeDevTools/chrome-devtools-mcp
