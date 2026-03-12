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

function decodeUnicodeEscapes(text) {
  return text.replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) =>
    String.fromCharCode(Number.parseInt(hex, 16)),
  );
}

describe("repository layout", () => {
  test("keeps only the primary bookmarklet in the active root/docs paths", () => {
    expect(existsSync(rootPath("README.md"))).toBe(true);
    expect(existsSync(rootPath("README.ja.md"))).toBe(true);
    expect(existsSync(rootPath("LICENSE"))).toBe(true);
    expect(existsSync(rootPath("ai-chat-export.bookmarklet.oneliner.js"))).toBe(true);
    expect(existsSync(rootPath("ai-chat-export.unified.bookmarklet.oneliner.js"))).toBe(true);
    expect(existsSync(rootPath("ai-chat-export.chatgpt-claude.bookmarklet.oneliner.js"))).toBe(false);
    expect(existsSync(rootPath("ai-chat-export.aistudio-grok.bookmarklet.oneliner.js"))).toBe(false);
    expect(existsSync(rootPath("ai-chat-export.claude.bookmarklet.oneliner.js"))).toBe(false);
    expect(existsSync(rootPath("docs", "ai-chat-export.bookmarklet.oneliner.js"))).toBe(true);
    expect(existsSync(rootPath("docs", "ai-chat-export.unified.bookmarklet.oneliner.js"))).toBe(true);
    expect(existsSync(rootPath("docs", "ai-chat-export.chatgpt-claude.bookmarklet.oneliner.js"))).toBe(false);
    expect(existsSync(rootPath("docs", "ai-chat-export.aistudio-grok.bookmarklet.oneliner.js"))).toBe(false);
    expect(existsSync(rootPath("docs", "ai-chat-export.claude.bookmarklet.oneliner.js"))).toBe(false);

    expect(existsSync(rootPath("src", "ai-chat-export.js"))).toBe(true);
    expect(existsSync(rootPath("scripts", "generate_oneline_bookmarklet.sh"))).toBe(true);
    expect(existsSync(rootPath("scripts", "sync_docs_assets.sh"))).toBe(true);
    expect(existsSync(rootPath("scripts", "sync_site_docs.sh"))).toBe(true);
    expect(existsSync(rootPath("docs-src"))).toBe(true);
    expect(existsSync(rootPath("archive"))).toBe(true);

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

  test("generates legacy outputs into archive and syncs only the bookmarklet docs asset", () => {
    const generator = readRepoFile("scripts", "generate_oneline_bookmarklet.sh");
    expect(generator).toContain('ARCHIVE_DIST_DIR="${ROOT_DIR}/archive/dist"');
    expect(generator).toContain('ARCHIVE_BOOKMARKLET_DIR="${ROOT_DIR}/archive/bookmarklets"');
    expect(generator).toContain('ARCHIVE_VARIANTS_DIR="${ROOT_DIR}/archive/variants"');
    expect(generator).toContain('ARCHIVE_LOADERS_DIR="${ROOT_DIR}/archive/loaders"');
    expect(generator).toContain('MIN_OUT="${ARCHIVE_DIST_DIR}/ai-chat-export.min.js"');
    expect(generator).toContain('OUT="${ARCHIVE_DIST_DIR}/ai-chat-export.oneliner.js"');
    expect(generator).toContain('PUBLIC_MIN_OUT="${ARCHIVE_DIST_DIR}/ai-chat-export.public.min.js"');
    expect(generator).toContain('LITE_PUBLIC_MIN_OUT="${ARCHIVE_DIST_DIR}/ai-chat-export.public.no-obs.min.js"');
    expect(generator).toContain('MINIMAL_PUBLIC_MIN_OUT="${ARCHIVE_DIST_DIR}/ai-chat-export.public.minimal.min.js"');
    expect(generator).toContain('UNIFIED_BOOKMARKLET_OUT="${ROOT_DIR}/ai-chat-export.unified.bookmarklet.oneliner.js"');
    expect(generator).toContain('UNIFIED_FIREFOX_PUBLIC_MIN_OUT="${ARCHIVE_DIST_DIR}/ai-chat-export.unified.firefox.minimal.min.js"');
    expect(generator).toContain('UNIFIED_FIREFOX_PUBLIC_OUT="${ARCHIVE_VARIANTS_DIR}/ai-chat-export.unified.firefox.minimal.oneliner.js"');
    expect(generator).toContain('CHATGPT_CLAUDE_MINIMAL_PUBLIC_OUT="${ARCHIVE_VARIANTS_DIR}/ai-chat-export.chatgpt-claude.minimal.oneliner.js"');
    expect(generator).toContain('AISTUDIO_GROK_MINIMAL_PUBLIC_OUT="${ARCHIVE_VARIANTS_DIR}/ai-chat-export.aistudio-grok.minimal.oneliner.js"');
    expect(generator).toContain('PUBLIC_OUT="${ARCHIVE_BOOKMARKLET_DIR}/ai-chat-export.public.oneliner.js"');
    expect(generator).toContain('LITE_PUBLIC_OUT="${ARCHIVE_VARIANTS_DIR}/ai-chat-export.public.no-obs.oneliner.js"');
    expect(generator).toContain('LITE_PUBLIC_ENCODED_OUT="${ARCHIVE_VARIANTS_DIR}/ai-chat-export.public.no-obs.encoded.oneliner.js"');
    expect(generator).toContain('MINIMAL_PUBLIC_OUT="${ARCHIVE_VARIANTS_DIR}/ai-chat-export.public.minimal.oneliner.js"');
    expect(generator).toContain('CLAUDE_MINIMAL_PUBLIC_OUT="${ARCHIVE_VARIANTS_DIR}/ai-chat-export.claude.minimal.oneliner.js"');

    const syncAssets = readRepoFile("scripts", "sync_docs_assets.sh");
    expect(syncAssets).toContain("ai-chat-export.bookmarklet.oneliner.js");
    expect(syncAssets).toContain("ai-chat-export.unified.bookmarklet.oneliner.js");
    expect(syncAssets).toContain("docs/ai-chat-export.bookmarklet.oneliner.js");
    expect(syncAssets).toContain("docs/ai-chat-export.unified.bookmarklet.oneliner.js");
    expect(syncAssets).toContain("docs/ai-chat-export.chatgpt-claude.bookmarklet.oneliner.js");
    expect(syncAssets).toContain("docs/ai-chat-export.aistudio-grok.bookmarklet.oneliner.js");
    expect(syncAssets).toContain("docs/ai-chat-export.claude.bookmarklet.oneliner.js");
    expect(syncAssets).toContain("rm -f");
    expect((syncAssets.match(/\bcp\b/g) || []).length).toBe(2);

    const syncDocs = readRepoFile("scripts", "sync_site_docs.sh");
    expect(syncDocs).toContain("find");
    expect(syncDocs).toContain("-name '*.md'");
    expect(syncDocs).toContain("-delete");
  });

  test("updates the readmes to present the primary bookmarklet and archive legacy assets", () => {
    const readme = readRepoFile("README.md");
    const readmeJa = readRepoFile("README.ja.md");

    expect(readme).toContain("ai-chat-export.bookmarklet.oneliner.js");
    expect(readme).toContain("ai-chat-export.unified.bookmarklet.oneliner.js");
    expect(readme).toContain("Chrome");
    expect(readme).toContain("Firefox");
    expect(readme).toContain("archive/README.ja.md");
    expect(readme).toContain("docs/codex-cli-frontend-setup.ja.md");
    expect(readme).not.toContain("docs/public-bookmarklet.ja.md");
    expect(readme).not.toContain("ai-chat-export.chatgpt-claude.bookmarklet.oneliner.js");
    expect(readme).not.toContain("ai-chat-export.aistudio-grok.bookmarklet.oneliner.js");
    expect(readme).not.toContain("ai-chat-export.claude.bookmarklet.oneliner.js");
    expect(readme).not.toContain("ai-chat-export.public.oneliner.js");
    expect(readme).not.toContain("dist/ai-chat-export.public.min.js");
    expect(readme).not.toContain("loaders/ai-chat-export.github-pages.oneliner.js");

    expect(readmeJa).toContain("## このツールの目的");
    expect(readmeJa).toContain("## 主な機能");
    expect(readmeJa).toContain("ai-chat-export.bookmarklet.oneliner.js");
    expect(readmeJa).toContain("ai-chat-export.unified.bookmarklet.oneliner.js");
    expect(readmeJa).toContain("Chrome");
    expect(readmeJa).toContain("Firefox");
    expect(readmeJa).toContain("統合版");
    expect(readmeJa).toContain("archive/README.ja.md");
    expect(readmeJa).toContain("docs/codex-cli-frontend-setup.ja.md");
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
  });

  test("updates docs pages to recommend only the unified Chrome and Firefox bookmarklets", () => {
    const pages = [
      readRepoFile("docs-src", "README.ja.md"),
      readRepoFile("docs-src", "index.md"),
    ];

    for (const page of pages) {
      expect(page).toContain("ai-chat-export.bookmarklet.oneliner.js");
      expect(page).toContain("ai-chat-export.unified.bookmarklet.oneliner.js");
      expect(page).toContain("Chrome");
      expect(page).toContain("Firefox");
      expect(page).toContain("archive/README.ja.md");
      expect(page).not.toContain("ai-chat-export.chatgpt-claude.bookmarklet.oneliner.js");
      expect(page).not.toContain("ai-chat-export.aistudio-grok.bookmarklet.oneliner.js");
      expect(page).not.toContain("ai-chat-export.claude.bookmarklet.oneliner.js");
      expect(page).not.toContain("./ai-chat-export.public.oneliner.js");
      expect(page).not.toContain("./ai-chat-export.public.min.js");
    }
  });

  test("keeps the docs bookmarklet asset synced with the root bookmarklet", () => {
    expect(readRepoFile("ai-chat-export.bookmarklet.oneliner.js")).toBe(
      readRepoFile("docs", "ai-chat-export.bookmarklet.oneliner.js"),
    );
    expect(readRepoFile("ai-chat-export.unified.bookmarklet.oneliner.js")).toBe(
      readRepoFile("docs", "ai-chat-export.unified.bookmarklet.oneliner.js"),
    );
  });

  test("archives the legacy bookmarklet variants and developer builds", () => {
    expect(existsSync(rootPath("archive", "README.ja.md"))).toBe(true);
    expect(existsSync(rootPath("archive", "bookmarklets", "ai-chat-export.public.oneliner.js"))).toBe(true);
    expect(existsSync(rootPath("archive", "variants", "ai-chat-export.public.no-obs.oneliner.js"))).toBe(true);
    expect(existsSync(rootPath("archive", "variants", "ai-chat-export.public.no-obs.encoded.oneliner.js"))).toBe(true);
    expect(existsSync(rootPath("archive", "variants", "ai-chat-export.public.minimal.oneliner.js"))).toBe(true);
    expect(existsSync(rootPath("archive", "variants", "ai-chat-export.unified.firefox.minimal.oneliner.js"))).toBe(true);
    expect(existsSync(rootPath("archive", "variants", "ai-chat-export.chatgpt-claude.minimal.oneliner.js"))).toBe(true);
    expect(existsSync(rootPath("archive", "variants", "ai-chat-export.aistudio-grok.minimal.oneliner.js"))).toBe(true);
    expect(existsSync(rootPath("archive", "variants", "ai-chat-export.claude.minimal.oneliner.js"))).toBe(true);
    expect(existsSync(rootPath("archive", "variants", "old.js"))).toBe(true);
    expect(existsSync(rootPath("archive", "dist", "ai-chat-export.public.min.js"))).toBe(true);
    expect(existsSync(rootPath("archive", "dist", "ai-chat-export.public.no-obs.min.js"))).toBe(true);
    expect(existsSync(rootPath("archive", "dist", "ai-chat-export.public.minimal.min.js"))).toBe(true);
    expect(existsSync(rootPath("archive", "dist", "ai-chat-export.unified.firefox.minimal.min.js"))).toBe(true);
    expect(existsSync(rootPath("archive", "dist", "ai-chat-export.chatgpt-claude.minimal.min.js"))).toBe(true);
    expect(existsSync(rootPath("archive", "dist", "ai-chat-export.aistudio-grok.minimal.min.js"))).toBe(true);
    expect(existsSync(rootPath("archive", "dist", "ai-chat-export.claude.minimal.min.js"))).toBe(true);
    expect(existsSync(rootPath("archive", "dist", "ai-chat-export.min.js"))).toBe(true);
    expect(existsSync(rootPath("archive", "dist", "ai-chat-export.oneliner.js"))).toBe(true);
    expect(existsSync(rootPath("archive", "loaders", "ai-chat-export.github-pages.oneliner.js"))).toBe(true);
    expect(existsSync(rootPath("archive", "loaders", "ai-chat-export.github-pages.fetch-loader.oneliner.js"))).toBe(true);
  });

  test("keeps the root bookmarklet alias synced with the archived minimal variant", () => {
    expect(readRepoFile("ai-chat-export.bookmarklet.oneliner.js")).toBe(
      readRepoFile("archive", "variants", "ai-chat-export.public.minimal.oneliner.js"),
    );
    expect(readRepoFile("ai-chat-export.unified.bookmarklet.oneliner.js")).toBe(
      readRepoFile("archive", "variants", "ai-chat-export.unified.firefox.minimal.oneliner.js"),
    );
  });

  test("keeps the archived minimal bookmarklet compact and copy-safe", () => {
    const old = readRepoFile("archive", "variants", "old.js");
    const lite = readRepoFile("archive", "variants", "ai-chat-export.public.no-obs.oneliner.js");
    const minimal = readRepoFile("archive", "variants", "ai-chat-export.public.minimal.oneliner.js");
    const decoded = decodeUnicodeEscapes(minimal);

    expect(minimal).toContain("[\"std\",\"txt\"]");
    expect(minimal).toContain('label:"Markdown"');
    expect(minimal).not.toContain('label:"JSON"');
    expect(minimal).not.toContain("application/json");
    expect(minimal).not.toContain("Obsidian");
    expect(decoded).toContain("プレーンテキスト");
    expect(decoded).not.toContain("保存内容プレビュー");
    expect(decoded).not.toContain("くわしい判定を見る");
    expect(decoded).not.toContain("SE向け詳細を見る");
    expect(decoded).not.toContain("手動コピー欄");
    expect(decoded).toContain("prompt(");
    expect(decoded).toContain("コピーできなかったため、この欄から手動でコピーしてください。");
    expect(decoded).not.toContain("コピーできなかったため、ファイル保存に切り替えます。");
    expect(minimal.length).toBeLessThan(lite.length);
    expect(minimal.length).toBeLessThan(old.length);
  });

  test("archives specialized shorter bookmarklet variants", () => {
    const generic = readRepoFile("ai-chat-export.bookmarklet.oneliner.js");
    const chatgptClaude = readRepoFile("archive", "variants", "ai-chat-export.chatgpt-claude.minimal.oneliner.js");
    const aiStudioGrok = readRepoFile("archive", "variants", "ai-chat-export.aistudio-grok.minimal.oneliner.js");
    const claude = readRepoFile("archive", "variants", "ai-chat-export.claude.minimal.oneliner.js");

    expect(chatgptClaude).toContain("claude.ai");
    expect(chatgptClaude).toContain("chatgpt.com");
    expect(chatgptClaude).not.toContain("aistudio.google.com");
    expect(chatgptClaude).not.toContain("x.com");
    expect(chatgptClaude.length).toBeLessThan(generic.length);
    expect(chatgptClaude.length).toBeLessThan(62000);

    expect(aiStudioGrok).not.toContain("claude.ai");
    expect(aiStudioGrok).not.toContain("chatgpt.com");
    expect(aiStudioGrok).toContain("aistudio.google.com");
    expect(aiStudioGrok).toContain("x.com");
    expect(aiStudioGrok.length).toBeLessThan(generic.length);
    expect(aiStudioGrok.length).toBeLessThan(60000);

    expect(claude).toContain("claude.ai");
    expect(claude).not.toContain("chatgpt.com");
    expect(claude).not.toContain("aistudio.google.com");
    expect(claude).not.toContain("x.com");
    expect(claude.length).toBeLessThan(generic.length);
    expect(claude.length).toBeLessThan(64000);
  });

  test("ships a Firefox-safe ASCII unified bookmarklet variant", () => {
    const generic = readRepoFile("ai-chat-export.bookmarklet.oneliner.js");
    const unified = readRepoFile("ai-chat-export.unified.bookmarklet.oneliner.js");

    expect(unified).toContain("claude.ai");
    expect(unified).toContain("chatgpt.com");
    expect(unified).toContain("aistudio.google.com");
    expect(unified).toContain("x.com");
    expect(unified.length).toBeLessThan(generic.length);
    expect(unified.length).toBeLessThan(62000);
    expect(/[^\x00-\x7F]/.test(unified)).toBe(false);
    expect(unified).toContain(".filter(Boolean)");
  });
});
