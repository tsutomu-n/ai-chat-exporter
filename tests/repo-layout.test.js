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

describe("repository layout", () => {
  test("keeps only the primary bookmarklet in the active root/docs paths", () => {
    expect(existsSync(rootPath("README.md"))).toBe(true);
    expect(existsSync(rootPath("README.ja.md"))).toBe(true);
    expect(existsSync(rootPath("README.zh-CN.md"))).toBe(true);
    expect(existsSync(rootPath("LICENSE"))).toBe(true);
    expect(existsSync(rootPath("ai-chat-export.chrome.bookmarklet.oneliner.js"))).toBe(true);
    expect(existsSync(rootPath("ai-chat-export.firefox.bookmarklet.oneliner.js"))).toBe(true);
    expect(existsSync(rootPath("ai-chat-export.bookmarklet.oneliner.js"))).toBe(false);
    expect(existsSync(rootPath("ai-chat-export.unified.bookmarklet.oneliner.js"))).toBe(false);
    expect(existsSync(rootPath("ai-chat-export.chatgpt-claude.bookmarklet.oneliner.js"))).toBe(false);
    expect(existsSync(rootPath("ai-chat-export.aistudio-grok.bookmarklet.oneliner.js"))).toBe(false);
    expect(existsSync(rootPath("ai-chat-export.claude.bookmarklet.oneliner.js"))).toBe(false);
    expect(existsSync(rootPath("docs", "ai-chat-export.chrome.bookmarklet.oneliner.js"))).toBe(true);
    expect(existsSync(rootPath("docs", "ai-chat-export.firefox.bookmarklet.oneliner.js"))).toBe(true);
    expect(existsSync(rootPath("docs", "ai-chat-export.bookmarklet.oneliner.js"))).toBe(false);
    expect(existsSync(rootPath("docs", "ai-chat-export.unified.bookmarklet.oneliner.js"))).toBe(false);
    expect(existsSync(rootPath("docs", "ai-chat-export.chatgpt-claude.bookmarklet.oneliner.js"))).toBe(false);
    expect(existsSync(rootPath("docs", "ai-chat-export.aistudio-grok.bookmarklet.oneliner.js"))).toBe(false);
    expect(existsSync(rootPath("docs", "ai-chat-export.claude.bookmarklet.oneliner.js"))).toBe(false);

    expect(existsSync(rootPath("src", "ai-chat-export.js"))).toBe(true);
    expect(existsSync(rootPath("scripts", "generate_oneline_bookmarklet.sh"))).toBe(true);
    expect(existsSync(rootPath("scripts", "sync_docs_assets.sh"))).toBe(true);
    expect(existsSync(rootPath("scripts", "sync_site_docs.sh"))).toBe(false);
    expect(existsSync(rootPath("docs-src"))).toBe(false);
    expect(existsSync(rootPath("docs", "index.ja.md"))).toBe(true);
    expect(existsSync(rootPath("docs", "index.zh-CN.md"))).toBe(true);
    expect(existsSync(rootPath("archive"))).toBe(false);

    expect(existsSync(rootPath("ai-chat-export.public.oneliner.js"))).toBe(false);
    expect(existsSync(rootPath("dist"))).toBe(false);
    expect(existsSync(rootPath("loaders"))).toBe(false);
    expect(existsSync(rootPath("variants"))).toBe(false);

    expect(existsSync(rootPath("docs", "ai-chat-export.public.oneliner.js"))).toBe(false);
    expect(existsSync(rootPath("docs", "ai-chat-export.public.min.js"))).toBe(false);
    expect(existsSync(rootPath("docs", "ai-chat-export.min.js"))).toBe(false);
    expect(existsSync(rootPath("docs", "ai-chat-export.github-pages.oneliner.js"))).toBe(false);
    expect(existsSync(rootPath("docs", "ai-chat-export.github-pages.fetch-loader.oneliner.js"))).toBe(false);
    expect(existsSync(rootPath("docs", "public-bookmarklet.ja.md"))).toBe(false);
    expect(existsSync(rootPath("docs", "bookmarklet-loader.ja.md"))).toBe(false);
    expect(existsSync(rootPath("docs", "github-pages-setup.ja.md"))).toBe(false);
  });

  test("generates only the public Chrome and Firefox bookmarklets and syncs docs assets", () => {
    const generator = readRepoFile("scripts", "generate_oneline_bookmarklet.sh");
    expect(generator).toContain('CHROME_BOOKMARKLET_OUT="${ROOT_DIR}/ai-chat-export.chrome.bookmarklet.oneliner.js"');
    expect(generator).toContain('FIREFOX_BOOKMARKLET_OUT="${ROOT_DIR}/ai-chat-export.firefox.bookmarklet.oneliner.js"');
    expect(generator).toContain('DOCS_CHROME_BOOKMARKLET_OUT="${ROOT_DIR}/docs/ai-chat-export.chrome.bookmarklet.oneliner.js"');
    expect(generator).toContain('DOCS_FIREFOX_BOOKMARKLET_OUT="${ROOT_DIR}/docs/ai-chat-export.firefox.bookmarklet.oneliner.js"');
    expect(generator).not.toContain("archive/");
    expect(generator).not.toContain("ai-chat-export.public");
    expect(generator).not.toContain("ai-chat-export.chatgpt-claude");
    expect(generator).not.toContain("ai-chat-export.aistudio-grok");
    expect(generator).not.toContain("ai-chat-export.claude");

    const syncAssets = readRepoFile("scripts", "sync_docs_assets.sh");
    expect(syncAssets).toContain("ai-chat-export.chrome.bookmarklet.oneliner.js");
    expect(syncAssets).toContain("ai-chat-export.firefox.bookmarklet.oneliner.js");
    expect(syncAssets).toContain("docs/ai-chat-export.chrome.bookmarklet.oneliner.js");
    expect(syncAssets).toContain("docs/ai-chat-export.firefox.bookmarklet.oneliner.js");
    expect(syncAssets).not.toContain("chatgpt-claude");
    expect(syncAssets).not.toContain("aistudio-grok");
    expect(syncAssets).not.toContain("claude.bookmarklet");
    expect((syncAssets.match(/\bcp\b/g) || []).length).toBe(2);

  });

  test("updates the readmes to present only the public bookmarklets", () => {
    const readme = readRepoFile("README.md");
    const readmeJa = readRepoFile("README.ja.md");
    const readmeZh = readRepoFile("README.zh-CN.md");

    expect(readme).toContain("ai-chat-export.chrome.bookmarklet.oneliner.js");
    expect(readme).toContain("ai-chat-export.firefox.bookmarklet.oneliner.js");
    expect(readme).not.toContain("ai-chat-export.bookmarklet.oneliner.js");
    expect(readme).not.toContain("ai-chat-export.unified.bookmarklet.oneliner.js");
    expect(readme).toContain("Chrome");
    expect(readme).toContain("Firefox");
    expect(readme).not.toContain("docs/public-bookmarklet.ja.md");
    expect(readme).not.toContain("ai-chat-export.chatgpt-claude.bookmarklet.oneliner.js");
    expect(readme).not.toContain("ai-chat-export.aistudio-grok.bookmarklet.oneliner.js");
    expect(readme).not.toContain("ai-chat-export.claude.bookmarklet.oneliner.js");
    expect(readme).not.toContain("ai-chat-export.public.oneliner.js");
    expect(readme).not.toContain("dist/ai-chat-export.public.min.js");
    expect(readme).not.toContain("loaders/ai-chat-export.github-pages.oneliner.js");
    expect(readme).not.toContain("archive/README.ja.md");
    expect(readme).not.toContain("archive/");
    expect(readme).not.toContain("docs/codex-cli-frontend-setup.ja.md");
    expect(readme).toContain("docs/index.md");
    expect(readme).toContain("[docs/index.md](docs/index.md)");
    expect(readme).toContain("[Japanese README](README.ja.md)");
    expect(readme).toContain("[Chinese README](README.zh-CN.md)");
    expect(readme).toContain("Apache License 2.0");
    expect(readme).not.toContain("\nMIT\n");
    expect(readme).toContain("## Why this tool exists");
    expect(readme).toContain("## Key features");
    expect(readme).toContain("quality check");
    expect(readme).toContain("clipboard");
    expect(readme).toContain("No browser extension is needed");
    expect(readme).toContain("One-file version for Chrome / Chromium");
    expect(readme).toContain("Remembers your mode and format in the browser");

    expect(readmeJa).toContain("## このツールの目的");
    expect(readmeJa).toContain("## 主な機能");
    expect(readmeJa).toContain("長い AI チャット");
    expect(readmeJa).toContain("品質判定");
    expect(readmeJa).toContain("クリップボード");

    expect(readmeZh).toContain("# AI 聊天导出");
    expect(readmeZh).toContain("## 这个工具的用途");
    expect(readmeZh).toContain("## 主要功能");
    expect(readmeZh).toContain("质量检查");
    expect(readmeZh).toContain("剪贴板");
  });

  test("ships english and japanese public guides under docs", () => {
    const page = readRepoFile("docs", "index.md");
    const pageJa = readRepoFile("docs", "index.ja.md");
    const pageZh = readRepoFile("docs", "index.zh-CN.md");

    expect(page).toContain("# AI Chat Export Guide");
    expect(page).toContain("ai-chat-export.chrome.bookmarklet.oneliner.js");
    expect(page).toContain("ai-chat-export.firefox.bookmarklet.oneliner.js");
    expect(page).toContain("src/ai-chat-export.js");
    expect(page).toContain("scripts/generate_oneline_bookmarklet.sh");
    expect(page).toContain("source");
    expect(page).toContain("distribution");
    expect(page).not.toContain("bookmarklet.oneliner`");
    expect(page).not.toContain("unified.bookmarklet.oneliner`");
    expect(page).not.toContain("ai-chat-export.bookmarklet.oneliner.js");
    expect(page).not.toContain("ai-chat-export.unified.bookmarklet.oneliner.js");
    expect(page).toContain("Chrome");
    expect(page).toContain("Firefox");
    expect(page).not.toContain("ai-chat-export.chatgpt-claude.bookmarklet.oneliner.js");
    expect(page).not.toContain("ai-chat-export.aistudio-grok.bookmarklet.oneliner.js");
    expect(page).not.toContain("ai-chat-export.claude.bookmarklet.oneliner.js");
    expect(page).not.toContain("./ai-chat-export.public.oneliner.js");
    expect(page).not.toContain("./ai-chat-export.public.min.js");
    expect(page).not.toContain("archive/README.ja.md");
    expect(page).not.toContain("archive/");
    expect(page).toContain("[Japanese guide](./index.ja.md)");
    expect(page).toContain("[Chinese guide](./index.zh-CN.md)");
    expect(page).toContain("## Basic usage");
    expect(page).toContain("## Run modes");
    expect(page).toContain("## Output formats");
    expect(page).toContain("## Quality status");
    expect(page).toContain("## Save options");
    expect(page).toContain("Fast");
    expect(page).toContain("Normal");
    expect(page).toContain("Careful");
    expect(page).toContain("Markdown");
    expect(page).toContain("Plain text");
    expect(page).toContain("PASS");
    expect(page).toContain("WARN");
    expect(page).toContain("FAIL");
    expect(page).toContain("clipboard");
    expect(page).toContain("This public repo mainly ships these two bookmarklet files.");
    expect(page).toContain("Scrolls more and opens more hidden content.");

    expect(pageJa).toContain("# AIチャット書き出し 使い方ガイド");
    expect(pageJa).toContain("## 基本的な使い方");
    expect(pageJa).toContain("## 実行モードの違い");
    expect(pageJa).toContain("## 出力形式の違い");
    expect(pageJa).toContain("## 品質判定の見方");
    expect(pageJa).toContain("## 保存方法の違い");

    expect(pageZh).toContain("# AI 聊天导出使用指南");
    expect(pageZh).toContain("## 基本用法");
    expect(pageZh).toContain("## 运行模式");
    expect(pageZh).toContain("## 输出格式");
    expect(pageZh).toContain("## 质量状态");
    expect(pageZh).toContain("## 保存方式");
  });

  test("keeps the docs bookmarklet asset synced with the root bookmarklet", () => {
    expect(readRepoFile("ai-chat-export.chrome.bookmarklet.oneliner.js")).toBe(
      readRepoFile("docs", "ai-chat-export.chrome.bookmarklet.oneliner.js"),
    );
    expect(readRepoFile("ai-chat-export.firefox.bookmarklet.oneliner.js")).toBe(
      readRepoFile("docs", "ai-chat-export.firefox.bookmarklet.oneliner.js"),
    );
  });

  test("does not ship the archive directory in the public repository", () => {
    expect(existsSync(rootPath("archive"))).toBe(false);
  });

  test("keeps local Codex working memory out of the public repository surface", () => {
    expect(existsSync(rootPath(".gitignore"))).toBe(true);

    const gitignore = readRepoFile(".gitignore");
    expect(gitignore).toContain("# Local Codex working files");
    expect(gitignore).toContain(".ai_memory/");
    expect(gitignore).toContain("# Dependencies");
    expect(gitignore).toContain("node_modules/");
    expect(gitignore).toContain("# Test output");
    expect(gitignore).toContain("coverage/");
    expect(gitignore).toContain("# Environment files");
    expect(gitignore).toContain(".env");
    expect(gitignore).toContain(".env.*");
    expect(gitignore).toContain("# Editor and OS noise");
    expect(gitignore).toContain(".DS_Store");
    expect(gitignore).toContain(".vscode/");
    expect(gitignore).toContain(".idea/");
    expect(gitignore).toContain("*.log");
    expect(gitignore).not.toContain("docs/codex-cli-frontend-setup.ja.md");

    expect(existsSync(rootPath(".ai_memory"))).toBe(false);
  });

  test("documents the public repository boundary for local-only files", () => {
    const readme = readRepoFile("README.md");

    expect(readme).toContain("README.ja.md");
    expect(readme).toContain("README.zh-CN.md");
    expect(readme).not.toContain("docs/README.ja.md");
  });

  test("ships a Firefox-safe ASCII unified bookmarklet variant", () => {
    const generic = readRepoFile("ai-chat-export.chrome.bookmarklet.oneliner.js");
    const unified = readRepoFile("ai-chat-export.firefox.bookmarklet.oneliner.js");

    expect(generic).toContain("zh-CN");
    expect(unified).toContain("claude.ai");
    expect(unified).toContain("chatgpt.com");
    expect(unified).toContain("aistudio.google.com");
    expect(unified).toContain("x.com");
    expect(unified).toContain("zh-CN");
    expect(unified.length).toBeLessThan(generic.length);
    expect(unified.length).toBeLessThan(62000);
    expect(/[^\x00-\x7F]/.test(unified)).toBe(false);
    expect(unified).toContain(".filter(Boolean)");
    expect(unified).toContain("Export AI chat");
    expect(unified).toContain("Review before saving");
    expect(unified).toContain("Copy to clipboard");
    expect(unified).toContain("Comparison base:");
    expect(unified).toContain("Clipboard copy failed, switching to file save.");
  });

  test("keeps only the curated README screenshots under stable names", () => {
    expect(existsSync(rootPath("assets", "01-bookmark-setup.png"))).toBe(true);
    expect(existsSync(rootPath("assets", "02-config-dialog.png"))).toBe(true);
    expect(existsSync(rootPath("assets", "03-export-result.png"))).toBe(true);

    expect(existsSync(rootPath("assets", "README.ja.md"))).toBe(false);
    expect(existsSync(rootPath("assets", "screenshots", "README.md"))).toBe(false);
    expect(existsSync(rootPath("assets", "screenshots"))).toBe(false);
  });

  test("points the public readmes at the simplified public asset layout", () => {
    const readme = readRepoFile("README.md");
    const readmeJa = readRepoFile("README.ja.md");
    const readmeZh = readRepoFile("README.zh-CN.md");

    expect(readme).toContain("assets/01-bookmark-setup.png");
    expect(readme).toContain("assets/02-config-dialog.png");
    expect(readme).toContain("assets/03-export-result.png");
    expect(readme).not.toContain("assets/screenshots/");
    expect(readme).not.toContain("assets/README.ja.md");

    expect(readmeJa).toContain("assets/01-bookmark-setup.png");
    expect(readmeJa).toContain("assets/02-config-dialog.png");
    expect(readmeJa).toContain("assets/03-export-result.png");
    expect(readmeJa).not.toContain("assets/screenshots/");

    expect(readmeZh).toContain("assets/01-bookmark-setup.png");
    expect(readmeZh).toContain("assets/02-config-dialog.png");
    expect(readmeZh).toContain("assets/03-export-result.png");
    expect(readmeZh).not.toContain("assets/screenshots/");
  });

  test("ships the repository under Apache License 2.0", () => {
    const license = readRepoFile("LICENSE");

    expect(license).toContain("Apache License");
    expect(license).toContain("Version 2.0, January 2004");
    expect(license).toContain("http://www.apache.org/licenses/");
    expect(license).not.toContain("MIT License");
  });
});
