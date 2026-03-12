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
  test("keeps only the beginner bookmarklet at the root and moves generated files into folders", () => {
    expect(existsSync(rootPath("README.md"))).toBe(true);
    expect(existsSync(rootPath("README.ja.md"))).toBe(true);
    expect(existsSync(rootPath("LICENSE"))).toBe(true);
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
    expect(generator).toContain("dist/ai-chat-export.public.min.js");
    expect(generator).toContain("ai-chat-export.public.oneliner.js");

    const syncAssets = readRepoFile("scripts", "sync_docs_assets.sh");
    expect(syncAssets).toContain("dist/ai-chat-export.min.js");
    expect(syncAssets).toContain("dist/ai-chat-export.public.min.js");
    expect(syncAssets).toContain("ai-chat-export.public.oneliner.js");
    expect(syncAssets).toContain("loaders/ai-chat-export.github-pages.oneliner.js");
    expect(syncAssets).toContain("loaders/ai-chat-export.github-pages.fetch-loader.oneliner.js");

    const syncDocs = readRepoFile("scripts", "sync_site_docs.sh");
    expect(syncDocs).toContain("docs-src");
    expect(syncDocs).not.toContain("site-src");
  });

  test("updates root readmes to point readers at the single root bookmarklet", () => {
    const readmes = [readRepoFile("README.md"), readRepoFile("README.ja.md")];

    for (const readme of readmes) {
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
    expect(readmeJa).toContain("長い AI チャット");
    expect(readmeJa).toContain("品質判定");
    expect(readmeJa).toContain("クリップボード");
  });
});
