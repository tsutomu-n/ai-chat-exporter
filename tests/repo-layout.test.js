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
    expect(existsSync(rootPath("scripts", "sync_site_docs.sh"))).toBe(true);
    expect(existsSync(rootPath("docs-src"))).toBe(true);
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

    const syncDocs = readRepoFile("scripts", "sync_site_docs.sh");
    expect(syncDocs).toContain("find");
    expect(syncDocs).toContain("-name '*.md'");
    expect(syncDocs).toContain("-delete");
  });

  test("updates the readmes to present only the public bookmarklets", () => {
    const readme = readRepoFile("README.md");
    const readmeJa = readRepoFile("README.ja.md");

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

    expect(readmeJa).toContain("## このツールの目的");
    expect(readmeJa).toContain("## 主な機能");
    expect(readmeJa).toContain("ai-chat-export.chrome.bookmarklet.oneliner.js");
    expect(readmeJa).toContain("ai-chat-export.firefox.bookmarklet.oneliner.js");
    expect(readmeJa).not.toContain("ai-chat-export.bookmarklet.oneliner.js");
    expect(readmeJa).not.toContain("ai-chat-export.unified.bookmarklet.oneliner.js");
    expect(readmeJa).toContain("Chrome");
    expect(readmeJa).toContain("Firefox");
    expect(readmeJa).toContain("統合版");
    expect(readmeJa).not.toContain("docs/public-bookmarklet.ja.md");
    expect(readmeJa).not.toContain("ai-chat-export.chatgpt-claude.bookmarklet.oneliner.js");
    expect(readmeJa).not.toContain("ai-chat-export.aistudio-grok.bookmarklet.oneliner.js");
    expect(readmeJa).not.toContain("ai-chat-export.claude.bookmarklet.oneliner.js");
    expect(readmeJa).toContain("長い AI チャット");
    expect(readmeJa).toContain("品質判定");
    expect(readmeJa).toContain("クリップボード");
    expect(readmeJa).not.toContain("ai-chat-export.public.oneliner.js");
    expect(readmeJa).not.toContain("variants/ai-chat-export.public.no-obs.oneliner.js");
    expect(readmeJa).not.toContain("loaders/ai-chat-export.github-pages.oneliner.js");
    expect(readmeJa).not.toContain("archive/README.ja.md");
    expect(readmeJa).not.toContain("archive/");
    expect(readmeJa).not.toContain("docs/codex-cli-frontend-setup.ja.md");
  });

  test("updates docs pages to recommend only the unified Chrome and Firefox bookmarklets", () => {
    const pages = [
      readRepoFile("docs-src", "README.ja.md"),
      readRepoFile("docs-src", "index.md"),
    ];

    for (const page of pages) {
      expect(page).toContain("ai-chat-export.chrome.bookmarklet.oneliner.js");
      expect(page).toContain("ai-chat-export.firefox.bookmarklet.oneliner.js");
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
    }
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

    expect(existsSync(rootPath(".ai_memory"))).toBe(false);
  });

  test("documents the public repository boundary for local-only files", () => {
    const readme = readRepoFile("README.md");
    const readmeJa = readRepoFile("README.ja.md");

    expect(readme).toContain("Public Repository Notes");
    expect(readme).toContain("Local-only files");
    expect(readme).toContain(".ai_memory/");
    expect(readme).toContain("AGENTS.md");
    expect(readme).toContain(".agents/");

    expect(readmeJa).toContain("## 公開リポジトリ向けメモ");
    expect(readmeJa).toContain("ローカル専用ファイル");
    expect(readmeJa).toContain(".ai_memory/");
    expect(readmeJa).toContain("AGENTS.md");
    expect(readmeJa).toContain(".agents/");
  });

  test("ships a Firefox-safe ASCII unified bookmarklet variant", () => {
    const generic = readRepoFile("ai-chat-export.chrome.bookmarklet.oneliner.js");
    const unified = readRepoFile("ai-chat-export.firefox.bookmarklet.oneliner.js");

    expect(unified).toContain("claude.ai");
    expect(unified).toContain("chatgpt.com");
    expect(unified).toContain("aistudio.google.com");
    expect(unified).toContain("x.com");
    expect(unified.length).toBeLessThan(generic.length);
    expect(unified.length).toBeLessThan(62000);
    expect(/[^\x00-\x7F]/.test(unified)).toBe(false);
    expect(unified).toContain(".filter(Boolean)");
  });

  test("keeps only the curated README screenshots under stable names", () => {
    expect(existsSync(rootPath("assets", "01-bookmark-setup.png"))).toBe(true);
    expect(existsSync(rootPath("assets", "02-config-dialog.png"))).toBe(true);
    expect(existsSync(rootPath("assets", "03-export-result.png"))).toBe(true);

    expect(existsSync(rootPath("assets", "README.ja.md"))).toBe(false);
    expect(existsSync(rootPath("assets", "screenshots", "README.md"))).toBe(false);
    expect(existsSync(rootPath("assets", "screenshots"))).toBe(false);
  });

  test("points the japanese readme at the simplified public asset layout", () => {
    const readmeJa = readRepoFile("README.ja.md");

    expect(readmeJa).toContain("assets/01-bookmark-setup.png");
    expect(readmeJa).toContain("assets/02-config-dialog.png");
    expect(readmeJa).toContain("assets/03-export-result.png");
    expect(readmeJa).not.toContain("assets/screenshots/");
    expect(readmeJa).not.toContain("assets/README.ja.md");
  });
});
