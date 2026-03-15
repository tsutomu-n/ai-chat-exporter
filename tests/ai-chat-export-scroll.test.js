import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = path.join(repoRoot, "src", "ai-chat-export.js");

function loadScrollEngine() {
  const source = readFileSync(sourcePath, "utf8")
    .replace(/^javascript:/, "")
    .replace(
      /const app = new App\(\);\s*await app\.run\(\);\s*\n\s*\}\)\(\);\s*$/m,
      "globalThis.__AI_CHAT_EXPORT_TEST__ = { ScrollEngine };\n})();",
    );

  globalThis.window = globalThis;
  globalThis.__AI_CHAT_EXPORT_RUNNING__ = false;
  globalThis.localStorage = {
    getItem() {
      return null;
    },
    setItem() {},
    removeItem() {},
  };
  globalThis.location = {
    hostname: "example.com",
    href: "https://example.com/c/test-chat",
  };
  globalThis.navigator = {
    language: "en-US",
    clipboard: {
      async writeText() {},
    },
  };
  globalThis.Node = { TEXT_NODE: 3, ELEMENT_NODE: 1 };
  globalThis.Element = class {};
  globalThis.getComputedStyle = () => ({
    overflowY: "visible",
    display: "block",
    visibility: "visible",
    opacity: "1",
  });
  delete globalThis.__AI_CHAT_EXPORT_TEST__;

  new Function(source)();
  return globalThis.__AI_CHAT_EXPORT_TEST__.ScrollEngine;
}

async function harvestMessages(captures) {
  const ScrollEngine = loadScrollEngine();
  let captureIndex = 0;
  const scroller = {
    scrollTop: 600,
    scrollHeight: 1600,
    clientHeight: 1000,
    querySelectorAll() {
      return [];
    },
  };

  globalThis.window.innerWidth = 1200;
  globalThis.window.innerHeight = 1000;
  globalThis.window.scrollTo = (_x, y) => {
    scroller.scrollTop = y;
  };
  globalThis.document = {
    scrollingElement: scroller,
    documentElement: scroller,
    body: {
      appendChild() {},
      querySelectorAll() {
        return [];
      },
    },
    querySelector() {
      return null;
    },
    querySelectorAll(selector) {
      return selector === "*" ? [] : [];
    },
    title: "Scroll Engine Test",
  };

  const adapter = {
    extractMessages() {
      return captures[Math.min(captureIndex++, captures.length - 1)];
    },
    getPreferredScrollContainerSelectors() {
      return [];
    },
    getQualityPolicy() {
      return { penalizeWeakIdentity: false };
    },
  };

  return ScrollEngine.harvest(
    adapter,
    {
      preset: "fast",
      scrollMax: 3,
      scrollDelay: 0,
      autoExpand: false,
      expandMaxClicks: 0,
      expandClickDelay: 0,
      lang: "en",
    },
    () => {},
    { aborted: false, lang: "en" },
  );
}

describe("ScrollEngine weak identity handling", () => {
  test("keeps the later duplicate slot when a repeated weak-identity message expands", async () => {
    const result = await harvestMessages([
      [
        { role: "User", content: "AA" },
        { role: "Model", content: "XX" },
        { role: "User", content: "AA" },
        { role: "Model", content: "ZZ" },
      ],
      [
        { role: "User", content: "AA" },
        { role: "Model", content: "XX" },
        { role: "User", content: "AA long" },
        { role: "Model", content: "ZZ" },
      ],
    ]);

    expect(result.messages).toEqual([
      { role: "User", content: "AA", sig: expect.any(String) },
      { role: "Model", content: "XX", sig: expect.any(String) },
      { role: "User", content: "AA long", sig: expect.any(String) },
      { role: "Model", content: "ZZ", sig: expect.any(String) },
    ]);
  });

  test("preserves three repeated weak-identity slots when a new middle turn appears", async () => {
    const result = await harvestMessages([
      [
        { role: "User", content: "AA" },
        { role: "Model", content: "XX" },
        { role: "User", content: "AA" },
        { role: "Model", content: "ZZ" },
      ],
      [
        { role: "User", content: "AA" },
        { role: "Model", content: "XX" },
        { role: "User", content: "AA" },
        { role: "Model", content: "YY" },
        { role: "User", content: "AA" },
        { role: "Model", content: "ZZ" },
      ],
    ]);

    expect(result.messages).toEqual([
      { role: "User", content: "AA", sig: expect.any(String) },
      { role: "Model", content: "XX", sig: expect.any(String) },
      { role: "User", content: "AA", sig: expect.any(String) },
      { role: "Model", content: "YY", sig: expect.any(String) },
      { role: "User", content: "AA", sig: expect.any(String) },
      { role: "Model", content: "ZZ", sig: expect.any(String) },
    ]);
  });

  test("updates only the middle repeated weak-identity slot when later duplicates remain unchanged", async () => {
    const result = await harvestMessages([
      [
        { role: "User", content: "AA" },
        { role: "Model", content: "XX" },
        { role: "User", content: "AA" },
        { role: "Model", content: "YY" },
        { role: "User", content: "AA" },
        { role: "Model", content: "ZZ" },
      ],
      [
        { role: "User", content: "AA" },
        { role: "Model", content: "XX" },
        { role: "User", content: "AA long" },
        { role: "Model", content: "YY" },
        { role: "User", content: "AA" },
        { role: "Model", content: "ZZ" },
      ],
    ]);

    expect(result.messages).toEqual([
      { role: "User", content: "AA", sig: expect.any(String) },
      { role: "Model", content: "XX", sig: expect.any(String) },
      { role: "User", content: "AA long", sig: expect.any(String) },
      { role: "Model", content: "YY", sig: expect.any(String) },
      { role: "User", content: "AA", sig: expect.any(String) },
      { role: "Model", content: "ZZ", sig: expect.any(String) },
    ]);
  });

  test("handles repeated weak-identity model messages independently", async () => {
    const result = await harvestMessages([
      [
        { role: "User", content: "AA" },
        { role: "Model", content: "MM" },
        { role: "User", content: "BB" },
        { role: "Model", content: "MM" },
      ],
      [
        { role: "User", content: "AA" },
        { role: "Model", content: "MM long" },
        { role: "User", content: "BB" },
        { role: "Model", content: "MM" },
      ],
    ]);

    expect(result.messages).toEqual([
      { role: "User", content: "AA", sig: expect.any(String) },
      { role: "Model", content: "MM long", sig: expect.any(String) },
      { role: "User", content: "BB", sig: expect.any(String) },
      { role: "Model", content: "MM", sig: expect.any(String) },
    ]);
  });
});
