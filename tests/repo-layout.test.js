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

function sourceAppMethodNames() {
  const source = readRepoFile("src", "ai-chat-export.js");
  const classStart = source.indexOf("class App{");
  const classEnd = source.indexOf("\nconst app = new App();", classStart);
  const classBody = source.slice(classStart, classEnd);

  return new Set(
    [...classBody.matchAll(/\n {2}(?:async\s+)?([A-Za-z_$][\w$]*)\([^)]*\)\{/g)].map(
      ([, name]) => name,
    ),
  );
}

const appMethodNames = sourceAppMethodNames();

function calledAppMethods(code) {
  return [
    ...new Set(
      [...code.matchAll(/this\.([A-Za-z_$][\w$]*)\(/g)]
        .map(([, name]) => name)
        .filter((name) => appMethodNames.has(name)),
    ),
  ].sort();
}

function definedMethods(code) {
  return new Set(
    [...code.matchAll(/(?:^|[{};])(?:async\s+)?([A-Za-z_$][\w$]*)\([^)]*\)\{/g)].map(
      ([, name]) => name,
    ),
  );
}

function missingCalledMethods(code) {
  const defs = definedMethods(code);
  return calledAppMethods(code).filter((name) => !defs.has(name)).sort();
}

const languageVariants = ["ja", "en", "zh-CN"];
const browsers = ["chrome", "firefox"];

function rootBookmarkletPaths() {
  return browsers.flatMap((browser) =>
    languageVariants.map((lang) => `ai-chat-export.${browser}.${lang}.bookmarklet.oneliner.js`),
  );
}

function docsBookmarkletPaths() {
  return rootBookmarkletPaths().map((file) => path.join("docs", file));
}

describe("repository layout", () => {
  test("keeps only the primary bookmarklet in the active root/docs paths", () => {
    expect(existsSync(rootPath("README.md"))).toBe(true);
    expect(existsSync(rootPath("README.ja.md"))).toBe(true);
    expect(existsSync(rootPath("README.zh-CN.md"))).toBe(true);
    expect(existsSync(rootPath("LICENSE"))).toBe(true);
    for (const file of rootBookmarkletPaths()) {
      expect(existsSync(rootPath(file))).toBe(true);
    }
    expect(existsSync(rootPath("ai-chat-export.chrome.bookmarklet.oneliner.js"))).toBe(false);
    expect(existsSync(rootPath("ai-chat-export.firefox.bookmarklet.oneliner.js"))).toBe(false);
    expect(existsSync(rootPath("ai-chat-export.bookmarklet.oneliner.js"))).toBe(false);
    expect(existsSync(rootPath("ai-chat-export.unified.bookmarklet.oneliner.js"))).toBe(false);
    expect(existsSync(rootPath("ai-chat-export.chatgpt-claude.bookmarklet.oneliner.js"))).toBe(false);
    expect(existsSync(rootPath("ai-chat-export.aistudio-grok.bookmarklet.oneliner.js"))).toBe(false);
    expect(existsSync(rootPath("ai-chat-export.claude.bookmarklet.oneliner.js"))).toBe(false);
    for (const file of docsBookmarkletPaths()) {
      expect(existsSync(rootPath(file))).toBe(true);
    }
    expect(existsSync(rootPath("docs", "ai-chat-export.chrome.bookmarklet.oneliner.js"))).toBe(false);
    expect(existsSync(rootPath("docs", "ai-chat-export.firefox.bookmarklet.oneliner.js"))).toBe(false);
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

  test("generates only the public language-specific Chrome and Firefox bookmarklets and syncs docs assets", () => {
    const generator = readRepoFile("scripts", "generate_oneline_bookmarklet.sh");
    for (const file of rootBookmarkletPaths()) {
      expect(generator).toContain(file);
    }
    for (const file of docsBookmarkletPaths()) {
      expect(generator).toContain(file.replace(/\\/g, "/"));
    }
    expect(generator).not.toContain('ai-chat-export.chrome.bookmarklet.oneliner.js"');
    expect(generator).not.toContain('ai-chat-export.firefox.bookmarklet.oneliner.js"');
    expect(generator).not.toContain("archive/");
    expect(generator).not.toContain("ai-chat-export.public");
    expect(generator).not.toContain("ai-chat-export.chatgpt-claude");
    expect(generator).not.toContain("ai-chat-export.aistudio-grok");
    expect(generator).not.toContain("ai-chat-export.claude");

    const syncAssets = readRepoFile("scripts", "sync_docs_assets.sh");
    for (const file of rootBookmarkletPaths()) {
      expect(syncAssets).toContain(file);
    }
    for (const file of docsBookmarkletPaths()) {
      expect(syncAssets).toContain(file.replace(/\\/g, "/"));
    }
    expect(syncAssets).not.toContain("ai-chat-export.chrome.bookmarklet.oneliner.js");
    expect(syncAssets).not.toContain("ai-chat-export.firefox.bookmarklet.oneliner.js");
    expect(syncAssets).not.toContain("chatgpt-claude");
    expect(syncAssets).not.toContain("aistudio-grok");
    expect(syncAssets).not.toContain("claude.bookmarklet");
    expect((syncAssets.match(/\bcp\b/g) || []).length).toBe(6);

  });

  test("updates the readmes to present only the public bookmarklets", () => {
    const readme = readRepoFile("README.md");
    const readmeJa = readRepoFile("README.ja.md");
    const readmeZh = readRepoFile("README.zh-CN.md");

    expect(readme).toContain("ai-chat-export.chrome.ja.bookmarklet.oneliner.js");
    expect(readme).toContain("ai-chat-export.chrome.en.bookmarklet.oneliner.js");
    expect(readme).toContain("ai-chat-export.chrome.zh-CN.bookmarklet.oneliner.js");
    expect(readme).toContain("ai-chat-export.firefox.ja.bookmarklet.oneliner.js");
    expect(readme).toContain("ai-chat-export.firefox.en.bookmarklet.oneliner.js");
    expect(readme).toContain("ai-chat-export.firefox.zh-CN.bookmarklet.oneliner.js");
    expect(readme).not.toContain("ai-chat-export.chrome.bookmarklet.oneliner.js");
    expect(readme).not.toContain("ai-chat-export.firefox.bookmarklet.oneliner.js");
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
    expect(readme).toContain("Ships separate Japanese, English, and Simplified Chinese bookmarklets");
    expect(readme).toContain("Remembers your mode and format in the browser");
    expect(readme).toContain("The distributed bookmarklets use a compact result screen");
    expect(readme).toContain("do not include the full save preview");
    expect(readme).toContain("Language is fixed by file");
    expect(readme).toContain("matches your browser and language");

    expect(readmeJa).toContain("## このツールの目的");
    expect(readmeJa).toContain("## 主な機能");
    expect(readmeJa).toContain("長い AI チャット");
    expect(readmeJa).toContain("品質判定");
    expect(readmeJa).toContain("クリップボード");
    expect(readmeJa).toContain("日本語 / 英語 / 简体中文ごとの個別 bookmarklet");

    expect(readmeZh).toContain("# AI 聊天导出");
    expect(readmeZh).toContain("## 这个工具的用途");
    expect(readmeZh).toContain("## 主要功能");
    expect(readmeZh).toContain("质量检查");
    expect(readmeZh).toContain("剪贴板");
    expect(readmeZh).toContain("日文 / 英文 / 简体中文三个独立语言版本");
  });

  test("ships english and japanese public guides under docs", () => {
    const page = readRepoFile("docs", "index.md");
    const pageJa = readRepoFile("docs", "index.ja.md");
    const pageZh = readRepoFile("docs", "index.zh-CN.md");

    expect(page).toContain("# AI Chat Export Guide");
    expect(page).toContain("ai-chat-export.chrome.ja.bookmarklet.oneliner.js");
    expect(page).toContain("ai-chat-export.chrome.en.bookmarklet.oneliner.js");
    expect(page).toContain("ai-chat-export.chrome.zh-CN.bookmarklet.oneliner.js");
    expect(page).toContain("ai-chat-export.firefox.ja.bookmarklet.oneliner.js");
    expect(page).toContain("ai-chat-export.firefox.en.bookmarklet.oneliner.js");
    expect(page).toContain("ai-chat-export.firefox.zh-CN.bookmarklet.oneliner.js");
    expect(page).not.toContain("ai-chat-export.chrome.bookmarklet.oneliner.js");
    expect(page).not.toContain("ai-chat-export.firefox.bookmarklet.oneliner.js");
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
    expect(page).toContain("This public repo mainly ships these six bookmarklet files.");
    expect(page).toContain("Scrolls more and opens more hidden content.");
    expect(page).toContain("The distributed bookmarklets use a compact result screen");
    expect(page).toContain("do not include the full save preview");
    expect(page).toContain("fixed language");

    expect(pageJa).toContain("# AIチャット書き出し 使い方ガイド");
    expect(pageJa).toContain("## 基本的な使い方");
    expect(pageJa).toContain("## 実行モードの違い");
    expect(pageJa).toContain("## 出力形式の違い");
    expect(pageJa).toContain("## 品質判定の見方");
    expect(pageJa).toContain("## 保存方法の違い");
    expect(pageJa).toContain("Firefox で使う简体中文版");

    expect(pageZh).toContain("# AI 聊天导出使用指南");
    expect(pageZh).toContain("## 基本用法");
    expect(pageZh).toContain("## 运行模式");
    expect(pageZh).toContain("## 输出格式");
    expect(pageZh).toContain("## 质量状态");
    expect(pageZh).toContain("## 保存方式");
    expect(pageZh).toContain("这个公开仓库主要提供这 6 个书签脚本文件");
  });

  test("keeps the docs bookmarklet asset synced with the root bookmarklet", () => {
    for (const file of rootBookmarkletPaths()) {
      expect(readRepoFile(file)).toBe(readRepoFile("docs", file));
    }
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

  test("ships Firefox-safe ASCII variants for each language-specific Firefox bookmarklet", () => {
    const chromeJa = readRepoFile("ai-chat-export.chrome.ja.bookmarklet.oneliner.js");

    for (const lang of languageVariants) {
      const firefoxVariant = readRepoFile(`ai-chat-export.firefox.${lang}.bookmarklet.oneliner.js`);
      expect(firefoxVariant).toContain("claude.ai");
      expect(firefoxVariant).toContain("chatgpt.com");
      expect(firefoxVariant).toContain("aistudio.google.com");
      expect(firefoxVariant).toContain("x.com");
      expect(firefoxVariant.length).toBeLessThan(62500);
      expect(/[^\x00-\x7F]/.test(firefoxVariant)).toBe(false);
      expect(firefoxVariant).toContain(".filter(Boolean)");
    }

    const firefoxEn = readRepoFile("ai-chat-export.firefox.en.bookmarklet.oneliner.js");
    expect(firefoxEn.length).toBeLessThan(chromeJa.length);
    expect(firefoxEn).toContain("Export AI chat");
    expect(firefoxEn).toContain("Save review");
    expect(firefoxEn).toContain("Copy");
    expect(firefoxEn).toContain("Copy failed. Saving file.");
    expect(firefoxEn).toContain("Comparison base:");
  });

  test("removes language switching UI from generated language-specific bookmarklets", () => {
    const chromeJa = readRepoFile("ai-chat-export.chrome.ja.bookmarklet.oneliner.js");
    const chromeEn = readRepoFile("ai-chat-export.chrome.en.bookmarklet.oneliner.js");
    const chromeZh = readRepoFile("ai-chat-export.chrome.zh-CN.bookmarklet.oneliner.js");
    const firefoxJa = readRepoFile("ai-chat-export.firefox.ja.bookmarklet.oneliner.js");
    const firefoxEn = readRepoFile("ai-chat-export.firefox.en.bookmarklet.oneliner.js");
    const firefoxZh = readRepoFile("ai-chat-export.firefox.zh-CN.bookmarklet.oneliner.js");

    expect(chromeJa).not.toContain("言語");
    expect(chromeEn).not.toContain("Language");
    expect(chromeZh).not.toContain("语言");
    expect(firefoxJa).not.toContain("言語");
    expect(firefoxEn).not.toContain("Language");
    expect(firefoxZh).not.toContain("语言");
  });

  test("keeps zh locale scoped inside the compact busy dialog replacement", () => {
    const generator = readRepoFile("scripts", "generate_oneline_bookmarklet.sh");

    expect(generator).toContain("  updateBusyDialog(p){");
    expect(generator).toContain("    const zh = this.isChinese ? this.isChinese() : this.getLang&&this.getLang()==='zh-CN';");
    expect(generator).toContain("stage==='final' ? (ja?'最終確認中':zh?'正在做最后检查':'Final checks')");
  });

  test("keeps compact comparison labels aligned with the readable source behavior", () => {
    const generator = readRepoFile("scripts", "generate_oneline_bookmarklet.sh");

    expect(generator).toContain("comparisonBaseLabel(diff){");
    expect(generator).toContain("const label = this.qualityStatusText(q.status,true);");
    expect(generator).toContain("let hint = this.qualityHintText(q.status,true);");
    expect(generator).toContain("hint = this.largeDeltaHintText(true);");
    expect(generator).toContain("const statusText = this.qualityStatusText(q.status,true);");
    expect(generator).toContain("parts.push(ja || zh ? statusText : statusText.toLowerCase());");
    expect(generator).toContain("parts.push(this.largeDeltaLabelText());");
    expect(generator).toContain("const ui = isJa");
    expect(generator).toContain("? ['保存確認','中止','再実行','コピー','保存','コピー済み。','コピー失敗。保存します。','コピー失敗。手動コピーしてください。','コピー/保存失敗。']");
    expect(generator).toContain(": ['Save review','Cancel','Rerun','Copy','Save','Copied.','Copy failed. Saving file.','Copy failed. Copy here.','Copy/save failed.'];");
    expect(generator).toContain("const lines = [");
    expect(generator).toContain("diff?.comparisonKind === 'snapshot'");
    expect(generator).toContain("ja ? '前回結果' : zh ? '上一次结果' : 'Previous result'");
    expect(generator).toContain("const count = diff?.previous?.count;");
    expect(generator).toContain("\\`比較ベース: \\${label}（\\${count}件）\\`");
    expect(generator).toContain("\\`Comparison base: \\${label} (\\${count})\\`");
    expect(generator).toContain("\\`比较基准: \\${label}（\\${count}条）\\`");
    expect(generator).toContain("const alternateButtonLabel = options?.alternateButtonLabel || (isJa ? '前回結果' : isZh ? '上一次结果' : 'Previous result');");
    expect(generator).toContain("summary.diffLine || this.comparisonBaseLabel(diff)");
  });

  test("keeps compact quality wording helpers in generated bookmarklets", () => {
    const chromeEn = readRepoFile("ai-chat-export.chrome.en.bookmarklet.oneliner.js");
    const firefoxEn = readRepoFile("ai-chat-export.firefox.en.bookmarklet.oneliner.js");

    expect(chromeEn).toMatch(/formatPoints\([^)]*\)\{/);
    expect(chromeEn).toMatch(/qualityStatusText\([^)]*\)\{/);
    expect(chromeEn).toMatch(/qualityHintText\([^)]*\)\{/);
    expect(chromeEn).toMatch(/largeDeltaHintText\([^)]*\)\{/);
    expect(chromeEn).toMatch(/largeDeltaLabelText\(\)\{/);
    expect(firefoxEn).toMatch(/formatPoints\([^)]*\)\{/);
    expect(firefoxEn).toMatch(/qualityStatusText\([^)]*\)\{/);
    expect(firefoxEn).toMatch(/qualityHintText\([^)]*\)\{/);
    expect(firefoxEn).toMatch(/largeDeltaHintText\([^)]*\)\{/);
    expect(firefoxEn).toMatch(/largeDeltaLabelText\(\)\{/);
  });

  test("keeps generated bookmarklet helper dependencies self-contained", () => {
    for (const file of rootBookmarkletPaths()) {
      const code = readRepoFile(file);
      expect(missingCalledMethods(code)).toEqual([]);
    }
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
