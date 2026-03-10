import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function rootPath(...parts) {
  return path.join(repoRoot, ...parts);
}

function readRepoFile(...parts) {
  return readFileSync(rootPath(...parts), "utf8");
}

describe("codex frontend workflow guidance", () => {
  test("checks in a repository AGENTS.md for frontend debugging and testing", () => {
    expect(existsSync(rootPath("AGENTS.md"))).toBe(true);

    const agents = readRepoFile("AGENTS.md");
    expect(agents).toContain("Chrome DevTools MCP");
    expect(agents).toContain("Playwright");
    expect(agents).toContain(".agents/skills");
    expect(agents).toContain("ライブ調査");
    expect(agents).toContain("再現テスト");
  });

  test("documents Codex CLI setup for Chrome DevTools MCP and repository skills", () => {
    expect(existsSync(rootPath("docs-src", "codex-cli-frontend-setup.ja.md"))).toBe(true);
    expect(existsSync(rootPath("docs", "codex-cli-frontend-setup.ja.md"))).toBe(true);

    const doc = readRepoFile("docs-src", "codex-cli-frontend-setup.ja.md");
    expect(doc).toContain("codex mcp add chrome-devtools -- npx chrome-devtools-mcp@latest");
    expect(doc).toContain(".codex/config.toml");
    expect(doc).toContain(".agents/skills");
    expect(doc).toContain("/mcp");
    expect(doc).toContain("/skills");

    const readmeJa = readRepoFile("README.ja.md");
    expect(readmeJa).toContain("docs/codex-cli-frontend-setup.ja.md");
  });

  test("provides a frontend-debug skill for live investigation", () => {
    expect(existsSync(rootPath(".agents", "skills", "frontend-debug", "SKILL.md"))).toBe(true);
    expect(existsSync(rootPath(".agents", "skills", "frontend-debug", "agents", "openai.yaml"))).toBe(true);

    const skill = readRepoFile(".agents", "skills", "frontend-debug", "SKILL.md");
    expect(skill).toContain("name: frontend-debug");
    expect(skill).toContain("Chrome DevTools MCP");
    expect(skill).toContain("Playwright");
    expect(skill).toContain("既存の Chrome");
    expect(skill).toContain("再現手順");

    const metadata = readRepoFile(".agents", "skills", "frontend-debug", "agents", "openai.yaml");
    expect(metadata).toContain("interface:");
    expect(metadata).toContain("policy:");
    expect(metadata).toContain("dependencies:");
    expect(metadata).toContain("chrome-devtools");
  });

  test("provides a frontend-e2e skill for deterministic regression coverage", () => {
    expect(existsSync(rootPath(".agents", "skills", "frontend-e2e", "SKILL.md"))).toBe(true);
    expect(existsSync(rootPath(".agents", "skills", "frontend-e2e", "agents", "openai.yaml"))).toBe(true);

    const skill = readRepoFile(".agents", "skills", "frontend-e2e", "SKILL.md");
    expect(skill).toContain("name: frontend-e2e");
    expect(skill).toContain("Playwright");
    expect(skill).toContain("getByRole");
    expect(skill).toContain("web-first assertions");
    expect(skill).toContain("trace");

    const metadata = readRepoFile(".agents", "skills", "frontend-e2e", "agents", "openai.yaml");
    expect(metadata).toContain("interface:");
    expect(metadata).toContain("policy:");
    expect(metadata).toContain("$frontend-e2e");
  });
});
