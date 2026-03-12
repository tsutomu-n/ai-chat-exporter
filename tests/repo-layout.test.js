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
  test("keeps the root bookmarklet entry points while generated files live in folders", () => {
    expect(existsSync(rootPath("README.md"))).toBe(true);
    expect(existsSync(rootPath("README.ja.md"))).toBe(true);
    expect(existsSync(rootPath("LICENSE"))).toBe(true);
    expect(existsSync(rootPath("ai-chat-export.bookmarklet.oneliner.js"))).toBe(true);
    expect(existsSync(rootPath("ai-chat-export.public.oneliner.js"))).toBe(true);

    expect(existsSync(rootPath("src", "ai-chat-export.js"))).toBe(true);
    expect(existsSync(rootPath("dist", "ai-chat-export.min.js"))).toBe(true);
    expect(existsSync(rootPath("dist", "ai-chat-export.oneliner.js"))).toBe(true);
    expect(existsSync(rootPath("dist", "ai-chat-export.public.min.js"))).toBe(true);
    expect(existsSync(rootPath("loaders", "ai-chat-export.github-pages.oneliner.js"))).toBe(true);
    expect(existsSync(rootPath("loaders", "ai-chat-export.github-pages.fetch-loader.oneliner.js"))).toBe(true);
    expect(existsSync(rootPath("scripts", "generate_oneline_bookmarklet.sh"))).toBe(true);
    expect(existsSync(rootPath("scripts", "sync_docs_assets.sh"))).toBe(true);
    expect(existsSync(rootPath("scripts", "sync_site_docs.sh"))).toBe(true);
    expect(existsSync(rootPath("docs-src"))).toBe(true);

    expect(existsSync(rootPath("ai-chat-export.js"))).toBe(false);
    expect(existsSync(rootPath("ai-chat-export.min.js"))).toBe(false);
    expect(existsSync(rootPath("ai-chat-export.oneliner.js"))).toBe(false);
    expect(existsSync(rootPath("ai-chat-export.public.min.js"))).toBe(false);
    expect(existsSync(rootPath("ai-chat-export.github-pages.oneliner.js"))).toBe(false);
    expect(existsSync(rootPath("ai-chat-export.github-pages.fetch-loader.oneliner.js"))).toBe(false);
    expect(existsSync(rootPath("generate_oneline_bookmarklet.sh"))).toBe(false);
    expect(existsSync(rootPath("sync_docs_assets.sh"))).toBe(false);
    expect(existsSync(rootPath("sync_site_docs.sh"))).toBe(false);
    expect(existsSync(rootPath("site-src"))).toBe(false);
  });

  test("updates generator and sync scripts to the new folders", () => {
    const generator = readRepoFile("scripts", "generate_oneline_bookmarklet.sh");
    expect(generator).toContain("src/ai-chat-export.js");
    expect(generator).toContain("dist/ai-chat-export.min.js");
    expect(generator).toContain("dist/ai-chat-export.oneliner.js");
    expect(generator).toContain("ai-chat-export.bookmarklet.oneliner.js");
    expect(generator).toContain("dist/ai-chat-export.public.min.js");
    expect(generator).toContain("ai-chat-export.public.oneliner.js");
    expect(generator).toContain("dist/ai-chat-export.public.no-obs.min.js");
    expect(generator).toContain("variants/ai-chat-export.public.no-obs.oneliner.js");
    expect(generator).toContain("variants/ai-chat-export.public.no-obs.encoded.oneliner.js");
    expect(generator).toContain("dist/ai-chat-export.public.minimal.min.js");
    expect(generator).toContain("variants/ai-chat-export.public.minimal.oneliner.js");

    const syncAssets = readRepoFile("scripts", "sync_docs_assets.sh");
    expect(syncAssets).toContain("dist/ai-chat-export.min.js");
    expect(syncAssets).toContain("ai-chat-export.bookmarklet.oneliner.js");
    expect(syncAssets).toContain("dist/ai-chat-export.public.min.js");
    expect(syncAssets).toContain("ai-chat-export.public.oneliner.js");
    expect(syncAssets).toContain("loaders/ai-chat-export.github-pages.oneliner.js");
    expect(syncAssets).toContain("loaders/ai-chat-export.github-pages.fetch-loader.oneliner.js");

    const syncDocs = readRepoFile("scripts", "sync_site_docs.sh");
    expect(syncDocs).toContain("docs-src");
    expect(syncDocs).not.toContain("site-src");
  });

  test("updates root readmes to point readers at the minimal root bookmarklet first", () => {
    const readmes = [readRepoFile("README.md"), readRepoFile("README.ja.md")];

    for (const readme of readmes) {
      expect(readme).toContain("ai-chat-export.bookmarklet.oneliner.js");
      expect(readme).toContain("ai-chat-export.public.oneliner.js");
      expect(readme).toContain("dist/ai-chat-export.public.min.js");
      expect(readme).not.toContain("`ai-chat-export.public.min.js`");
      expect(readme).not.toContain("`ai-chat-export.min.js`");
      expect(readme).not.toContain("`ai-chat-export.oneliner.js`");
      expect(readme).not.toContain("`ai-chat-export.github-pages.oneliner.js`");
    }
  });

  test("keeps the Japanese README focused on purpose and core features", () => {
    const readmeJa = readRepoFile("README.ja.md");

    expect(readmeJa).toContain("## このツールの目的");
    expect(readmeJa).toContain("## 主な機能");
    expect(readmeJa).toContain("ai-chat-export.public.minimal.oneliner.js");
    expect(readmeJa).toContain("長い AI チャット");
    expect(readmeJa).toContain("品質判定");
    expect(readmeJa).toContain("クリップボード");
  });

  test("updates docs source pages to recommend the minimal bookmarklet first", () => {
    const pages = [
      readRepoFile("docs-src", "README.ja.md"),
      readRepoFile("docs-src", "index.md"),
      readRepoFile("docs-src", "public-bookmarklet.ja.md"),
    ];

    for (const page of pages) {
      expect(page).toContain("ai-chat-export.bookmarklet.oneliner.js");
    }
  });

  test("keeps public docs assets synced with the root public bookmarklet build", () => {
    expect(readRepoFile("ai-chat-export.bookmarklet.oneliner.js")).toBe(
      readRepoFile("docs", "ai-chat-export.bookmarklet.oneliner.js"),
    );
    expect(readRepoFile("ai-chat-export.public.oneliner.js")).toBe(
      readRepoFile("docs", "ai-chat-export.public.oneliner.js"),
    );
    expect(readRepoFile("dist", "ai-chat-export.public.min.js")).toBe(
      readRepoFile("docs", "ai-chat-export.public.min.js"),
    );
    expect(readRepoFile("dist", "ai-chat-export.min.js")).toBe(
      readRepoFile("docs", "ai-chat-export.min.js"),
    );
  });

  test("ships a lighter public bookmarklet without the Obsidian format", () => {
    const full = readRepoFile("ai-chat-export.public.oneliner.js");
    const lite = readRepoFile("variants", "ai-chat-export.public.no-obs.oneliner.js");

    expect(lite).toContain("label:\"Markdown\"");
    expect(lite).toContain("[\"std\",\"txt\",\"json\"]");
    expect(lite).not.toContain("Obsidian");
    expect(lite.length).toBeLessThan(full.length);
  });

  test("ships a bookmark-safe encoded no-obs bookmarklet variant", () => {
    const lite = readRepoFile("variants", "ai-chat-export.public.no-obs.oneliner.js");
    const encoded = readRepoFile("variants", "ai-chat-export.public.no-obs.encoded.oneliner.js");

    expect(encoded.startsWith("javascript:")).toBe(true);
    expect(encoded).toContain("%20");
    expect(encoded).not.toContain("Obsidian");
    expect(encoded.length).toBeGreaterThanOrEqual(lite.length);
  });

  test("ships a stricter minimal bookmarklet variant for short bookmark editors", () => {
    const old = readRepoFile("variants", "old.js");
    const lite = readRepoFile("variants", "ai-chat-export.public.no-obs.oneliner.js");
    const minimal = readRepoFile("variants", "ai-chat-export.public.minimal.oneliner.js");
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

  test("keeps the root bookmarklet alias synced with the minimal variant", () => {
    expect(readRepoFile("ai-chat-export.bookmarklet.oneliner.js")).toBe(
      readRepoFile("variants", "ai-chat-export.public.minimal.oneliner.js"),
    );
  });
});
