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
  test("does not ship Codex-only repository guidance files", () => {
    expect(existsSync(rootPath("AGENTS.md"))).toBe(false);
    expect(existsSync(rootPath(".agents"))).toBe(false);
  });

  test("does not publish Codex CLI setup docs", () => {
    expect(existsSync(rootPath("docs-src", "codex-cli-frontend-setup.ja.md"))).toBe(false);
    expect(existsSync(rootPath("docs", "codex-cli-frontend-setup.ja.md"))).toBe(false);

    const readmeJa = readRepoFile("README.ja.md");
    expect(readmeJa).not.toContain("docs/codex-cli-frontend-setup.ja.md");
  });

  test("does not publish repository-specific skill packs", () => {
    expect(existsSync(rootPath(".agents", "skills", "frontend-debug", "SKILL.md"))).toBe(false);
    expect(existsSync(rootPath(".agents", "skills", "frontend-e2e", "SKILL.md"))).toBe(false);
  });
});
