import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = path.join(repoRoot, "src", "ai-chat-export.js");

function loadApp({ storedConfig } = {}) {
  const store = new Map();
  const source = readFileSync(sourcePath, "utf8")
    .replace(/^javascript:/, "")
    .replace(
      /const app = new App\(\);\s*await app\.run\(\);\s*\n\s*\}\)\(\);\s*$/m,
      "globalThis.__AI_CHAT_EXPORT_TEST__ = { App, Utils, MarkdownParser };\n})();",
    );

  if (storedConfig) {
    store.set("ai-chat-export:v2_cfg_generic", JSON.stringify(storedConfig));
  }

  globalThis.window = globalThis;
  globalThis.location = {
    hostname: "example.com",
    origin: "https://example.com",
    pathname: "/c/test-chat",
    href: "https://example.com/c/test-chat",
    search: "",
  };
  globalThis.localStorage = {
    getItem(key) {
      return store.has(key) ? store.get(key) : null;
    },
    setItem(key, value) {
      store.set(key, String(value));
    },
    removeItem(key) {
      store.delete(key);
    },
  };
  globalThis.document = {
    title: "Format Test Chat",
    querySelector() {
      return null;
    },
    querySelectorAll() {
      return [];
    },
    body: {
      appendChild() {},
    },
  };
  globalThis.Element = class {};
  globalThis.Node = { TEXT_NODE: 3, ELEMENT_NODE: 1 };
  globalThis.getComputedStyle = () => ({
    display: "block",
    visibility: "visible",
    opacity: "1",
  });
  globalThis.__AI_CHAT_EXPORT_RUNNING__ = false;
  delete globalThis.__AI_CHAT_EXPORT_TEST__;

  new Function(source)();

  return {
    app: new globalThis.__AI_CHAT_EXPORT_TEST__.App(),
    store,
  };
}

describe("ai-chat export formats", () => {
  test("renders txt as readable plain text instead of raw markdown syntax", () => {
    const { app } = loadApp();
    app.config.fmt = "txt";

    const { fileName, output } = app.formatOutput(
      [
        {
          role: "User",
          content:
            "# Heading\n\n- first item\n\n[Link](https://example.com/docs)\n\n```js\nconst value = 1;\n```\n\n> quoted line",
        },
      ],
      { status: "PASS", score: 100 },
      { previous: null, lastAttempt: null },
    );

    expect(fileName.endsWith(".txt")).toBe(true);
    expect(output).toContain("Heading");
    expect(output).toContain("Link (https://example.com/docs)");
    expect(output).toContain("const value = 1;");
    expect(output).toContain("quoted line");
    expect(output).not.toContain("# Heading");
    expect(output).not.toContain("[Link](");
    expect(output).not.toContain("```js");
    expect(output).not.toContain("> quoted line");
  });

  test("omits txt header metadata when the compact text option is selected", () => {
    const { app } = loadApp();
    app.config.fmt = "txt";
    app.config.txtHeader = false;

    const { output } = app.formatOutput(
      [
        {
          role: "User",
          content: "Simple body",
        },
      ],
      { status: "PASS", score: 100 },
      { previous: null, lastAttempt: null },
    );

    expect(output).toContain("あなた:\nSimple body");
    expect(output).not.toContain("- 形式:");
    expect(output).not.toContain("- サイト:");
    expect(output).not.toContain("================");
  });

  test("builds the save preview from the final rendered output", () => {
    const { app } = loadApp();
    app.config.fmt = "txt";
    app.config.txtHeader = false;

    const preview = app.buildOutputPreview(
      [
        {
          role: "User",
          content: "# Heading\n\n[Link](https://example.com/docs)",
        },
      ],
      { status: "PASS", score: 100 },
      { previous: null, lastAttempt: null },
    );

    expect(preview.title).toContain("保存内容");
    expect(preview.text).toContain("Heading");
    expect(preview.text).toContain("Link (https://example.com/docs)");
    expect(preview.text).not.toContain("[Link](");
    expect(preview.text).not.toContain("# Heading");
  });

  test("falls back to the default format when persisted fmt is invalid", () => {
    const { app } = loadApp({
      storedConfig: {
        fmt: "bogus",
        preset: "normal",
        scrollMax: 32,
        scrollDelay: 220,
        autoExpand: true,
        expandMaxClicks: 24,
        expandClickDelay: 130,
        txtHeader: false,
      },
    });

    expect(app.config.fmt).toBe("std");
    expect(app.getFormatLabel()).toBe("標準Markdown");
    expect(app.config.txtHeader).toBe(false);
  });
});
