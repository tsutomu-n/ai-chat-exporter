import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = path.join(repoRoot, "src", "ai-chat-export.js");

function loadApp({ storedConfig, navigatorLanguage = "ja-JP" } = {}) {
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
  globalThis.navigator = {
    language: navigatorLanguage,
    languages: [navigatorLanguage],
    clipboard: {
      async writeText() {},
    },
  };
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

function setupUiDom() {
  class FakeNode {
    constructor(nodeType, ownerDocument = null) {
      this.nodeType = nodeType;
      this.ownerDocument = ownerDocument;
      this.parentNode = null;
      this.childNodes = [];
    }

    appendChild(child) {
      if (!child) return child;
      child.parentNode = this;
      if (this.nodeType === 1) child.parentElement = this;
      child.ownerDocument = this.ownerDocument || this;
      this.childNodes.push(child);
      return child;
    }

    append(...children) {
      for (const child of children) {
        if (Array.isArray(child)) {
          this.append(...child);
        } else if (typeof child === "string") {
          this.appendChild(this.ownerDocument.createTextNode(child));
        } else if (child != null) {
          this.appendChild(child);
        }
      }
    }

    remove() {
      const parent = this.parentNode;
      if (!parent) return;
      const idx = parent.childNodes.indexOf(this);
      if (idx >= 0) parent.childNodes.splice(idx, 1);
      this.parentNode = null;
      this.parentElement = null;
    }

    get textContent() {
      if (this.nodeType === 3) return this._text || "";
      return this.childNodes.map((child) => child.textContent).join("");
    }

    set textContent(value) {
      if (this.nodeType === 3) {
        this._text = String(value ?? "");
        return;
      }
      this.childNodes = [];
      if (value != null && value !== "") {
        this.appendChild(this.ownerDocument.createTextNode(String(value)));
      }
    }
  }

  class FakeTextNode extends FakeNode {
    constructor(text, ownerDocument) {
      super(3, ownerDocument);
      this._text = String(text ?? "");
    }
  }

  class FakeElement extends FakeNode {
    constructor(tagName, ownerDocument) {
      super(1, ownerDocument);
      this.tagName = String(tagName).toUpperCase();
      this.attributes = new Map();
      this.style = { cssText: "" };
      this.listeners = new Map();
      this.value = "";
      this.checked = false;
      this.type = "";
    }

    setAttribute(name, value) {
      this.attributes.set(name, String(value));
      if (name === "value") this.value = String(value);
      if (name === "type") this.type = String(value);
    }

    getAttribute(name) {
      return this.attributes.has(name) ? this.attributes.get(name) : null;
    }

    addEventListener(type, handler) {
      const rows = this.listeners.get(type) || [];
      rows.push(handler);
      this.listeners.set(type, rows);
    }

    dispatchEvent(event) {
      const handlers = this.listeners.get(event.type) || [];
      for (const handler of handlers) handler.call(this, event);
      return true;
    }

    click() {
      const event = {
        type: "click",
        preventDefault() {},
        stopPropagation() {},
      };
      this.dispatchEvent(event);
    }

    focus() {}

    querySelectorAll(selector) {
      const selectors = selector.split(",").map((part) => part.trim()).filter(Boolean);
      const out = [];
      const visit = (node) => {
        if (!(node instanceof FakeElement)) return;
        if (selectors.some((part) => matchesSelector(node, part))) out.push(node);
        for (const child of node.childNodes) visit(child);
      };
      for (const child of this.childNodes) visit(child);
      return out;
    }

    querySelector(selector) {
      return this.querySelectorAll(selector)[0] || null;
    }
  }

  function matchesSelector(el, selector) {
    const match = selector.match(/^([a-zA-Z0-9_-]+)(?:\[([^=\]]+)=['"]?([^"'\\]]+)['"]?\])?$/);
    if (!match) return false;
    const [, tag, attrName, attrValue] = match;
    if (tag && el.tagName.toLowerCase() !== tag.toLowerCase()) return false;
    if (!attrName) return true;
    return el.getAttribute(attrName) === attrValue;
  }

  class FakeDocument {
    constructor() {
      this.body = new FakeElement("body", this);
      this.title = "Format Test Chat";
    }

    createElement(tagName) {
      return new FakeElement(tagName, this);
    }

    createTextNode(text) {
      return new FakeTextNode(text, this);
    }

    querySelector(selector) {
      return this.body.querySelector(selector);
    }

    querySelectorAll(selector) {
      return this.body.querySelectorAll(selector);
    }
  }

  const document = new FakeDocument();
  globalThis.document = document;
  globalThis.Element = FakeElement;
  globalThis.Node = { TEXT_NODE: 3, ELEMENT_NODE: 1 };
  globalThis.getComputedStyle = () => ({
    display: "block",
    visibility: "visible",
    opacity: "1",
  });
  return document;
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
    expect(app.getFormatLabel()).toBe("Markdown");
    expect(app.config.txtHeader).toBe(false);
  });

  test("detects english as the initial language when the browser locale is not japanese", () => {
    const { app } = loadApp({ navigatorLanguage: "en-US" });

    expect(app.config.lang).toBe("en");
    expect(app.getFormatLabel()).toBe("Markdown");
    expect(app.roleLabel("User")).toBe("You");
  });

  test("detects chinese as the initial language when the browser locale is chinese", () => {
    const { app } = loadApp({ navigatorLanguage: "zh-CN" });

    expect(app.config.lang).toBe("zh-CN");
    expect(app.getFormatLabel()).toBe("Markdown");
    expect(app.roleLabel("User")).toBe("你");
  });

  test("uses the selected app language for the fallback conversation title", () => {
    const { app } = loadApp({
      navigatorLanguage: "ja-JP",
      storedConfig: {
        lang: "en",
        fmt: "std",
        preset: "normal",
        scrollMax: 32,
        scrollDelay: 220,
        autoExpand: true,
        expandMaxClicks: 24,
        expandClickDelay: 130,
        txtHeader: true,
      },
    });

    globalThis.document.title = "";

    const { output } = app.formatOutput(
      [{ role: "User", content: "prompt" }],
      { status: "PASS", score: 100 },
      { previous: null, lastAttempt: null },
    );

    expect(output).toContain("# Conversation");
    expect(output).not.toContain("# 会話");
  });

  test("uses the selected app language for markdown parser fallback labels", () => {
    const { app } = loadApp({
      navigatorLanguage: "ja-JP",
      storedConfig: {
        lang: "en",
        fmt: "std",
        preset: "normal",
        scrollMax: 32,
        scrollDelay: 220,
        autoExpand: true,
        expandMaxClicks: 24,
        expandClickDelay: 130,
        txtHeader: true,
      },
    });
    const document = setupUiDom();
    app.saveConfig();

    const img = document.createElement("img");
    const anchor = document.createElement("a");

    expect(globalThis.__AI_CHAT_EXPORT_TEST__.MarkdownParser.extract(img)).toBe("![Image](Image)");
    expect(globalThis.__AI_CHAT_EXPORT_TEST__.MarkdownParser.extract(anchor)).toBe("Link");
  });

  test("prefers the stored language over browser auto detection", () => {
    const { app } = loadApp({
      navigatorLanguage: "en-US",
      storedConfig: {
        lang: "ja",
        fmt: "std",
        preset: "normal",
        scrollMax: 32,
        scrollDelay: 220,
        autoExpand: true,
        expandMaxClicks: 24,
        expandClickDelay: 130,
        txtHeader: true,
      },
    });

    expect(app.config.lang).toBe("ja");
    expect(app.roleLabel("User")).toBe("あなた");
  });

  test("shows plain text in the config dialog and switches to txt when clicked", async () => {
    const { app } = loadApp();
    setupUiDom();

    const pending = app.showConfigDialog();
    const formatButtons = globalThis.document.body.querySelectorAll("button");
    const txtButton = formatButtons.find((button) => button.textContent.includes("プレーンテキスト"));

    expect(txtButton).toBeDefined();

    txtButton.click();

    expect(app.config.fmt).toBe("txt");

    const headerToggle = globalThis.document.body
      .querySelectorAll("input")
      .find((input) => input.getAttribute("type") === "checkbox");

    expect(headerToggle).toBeDefined();

    const startButton = globalThis.document.body
      .querySelectorAll("button")
      .find((button) => button.textContent === "開始");

    expect(startButton).toBeDefined();
    startButton.click();

    await expect(pending).resolves.toBe(true);
  });

  test("shows english labels in the config dialog and persists the selected language", async () => {
    const { app, store } = loadApp({ navigatorLanguage: "en-US" });
    setupUiDom();

    const pending = app.showConfigDialog();
    const buttons = globalThis.document.body.querySelectorAll("button");

    expect(globalThis.document.body.textContent).toContain("Export AI chat");
    expect(globalThis.document.body.textContent).toContain("Language");
    expect(globalThis.document.body.textContent).toContain("Mode");
    expect(globalThis.document.body.textContent).toContain("Save format");
    expect(globalThis.document.body.textContent).toContain("Advanced settings");
    expect(globalThis.document.body.textContent).not.toContain("Speed preset");

    const japaneseButton = buttons.find((button) => button.textContent.includes("日本語"));
    expect(japaneseButton).toBeDefined();
    japaneseButton.click();

    expect(app.config.lang).toBe("ja");
    expect(JSON.parse(store.get("ai-chat-export:v2_cfg_generic")).lang).toBe("ja");
    expect(globalThis.document.body.textContent).toContain("AIチャットを書き出す");

    const startButton = globalThis.document.body
      .querySelectorAll("button")
      .find((button) => button.textContent === "開始");
    startButton.click();

    await expect(pending).resolves.toBe(true);
  });

  test("shows localized language descriptions in japanese mode", async () => {
    const { app } = loadApp({ navigatorLanguage: "ja-JP" });
    setupUiDom();

    const pending = app.showConfigDialog();
    const text = globalThis.document.body.textContent;

    expect(text).toContain("日本語UIと出力ラベル");
    expect(text).toContain("英語UIと出力ラベル");
    expect(text).not.toContain("Japanese UI and output labels");

    const startButton = globalThis.document.body
      .querySelectorAll("button")
      .find((button) => button.textContent === "開始");
    startButton.click();

    await expect(pending).resolves.toBe(true);
  });

  test("shows chinese labels in the config dialog and persists the selected language", async () => {
    const { app, store } = loadApp({ navigatorLanguage: "zh-CN" });
    setupUiDom();

    const pending = app.showConfigDialog();
    const text = globalThis.document.body.textContent;

    expect(text).toContain("导出 AI 对话");
    expect(text).toContain("语言");
    expect(text).toContain("运行模式");
    expect(text).toContain("保存格式");
    expect(text).toContain("高级设置");
    expect(text).toContain("中文界面与导出标签");
    expect(text).toContain("英文界面与导出标签");
    expect(text).toContain("日文界面与导出标签");

    const englishButton = globalThis.document.body
      .querySelectorAll("button")
      .find((button) => button.textContent.includes("English"));

    expect(englishButton).toBeDefined();
    englishButton.click();

    expect(app.config.lang).toBe("en");
    expect(JSON.parse(store.get("ai-chat-export:v2_cfg_generic")).lang).toBe("en");
    expect(globalThis.document.body.textContent).toContain("Export AI chat");

    const startButton = globalThis.document.body
      .querySelectorAll("button")
      .find((button) => button.textContent === "Start");
    startButton.click();

    await expect(pending).resolves.toBe(true);
  });

  test("shows save formats in the intended button order", async () => {
    const { app } = loadApp();
    setupUiDom();

    const pending = app.showConfigDialog();
    const labels = ["Markdown", "プレーンテキスト", "Obsidian向け", "JSON"];
    const buttons = globalThis.document.body
      .querySelectorAll("button")
      .map((button) => {
        const text = button.textContent;
        return labels.find((label) => text.includes(label)) || null;
      })
      .filter(Boolean);

    expect(buttons).toEqual(["Markdown", "プレーンテキスト", "Obsidian向け", "JSON"]);

    const startButton = globalThis.document.body
      .querySelectorAll("button")
      .find((button) => button.textContent === "開始");
    startButton.click();

    await expect(pending).resolves.toBe(true);
  });

  test("uses Markdown as the standard markdown format label", () => {
    const { app } = loadApp();

    expect(app.getFormatLabel()).toBe("Markdown");
  });

  test("renders english metadata labels in txt output when lang is en", () => {
    const { app } = loadApp({
      navigatorLanguage: "en-US",
      storedConfig: {
        lang: "en",
        fmt: "txt",
        preset: "normal",
        scrollMax: 32,
        scrollDelay: 220,
        autoExpand: true,
        expandMaxClicks: 24,
        expandClickDelay: 130,
        txtHeader: true,
      },
    });

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

    expect(output).toContain("- Format: Plain text");
    expect(output).toContain("- Site: Generic");
    expect(output).toContain("- Messages: 1");
    expect(output).toContain("You:\nSimple body");
    expect(output).not.toContain("- 形式:");
    expect(output).not.toContain("あなた:");
  });

  test("renders chinese metadata labels in txt output when lang is zh-CN", () => {
    const { app } = loadApp({
      navigatorLanguage: "zh-CN",
      storedConfig: {
        lang: "zh-CN",
        fmt: "txt",
        preset: "normal",
        scrollMax: 32,
        scrollDelay: 220,
        autoExpand: true,
        expandMaxClicks: 24,
        expandClickDelay: 130,
        txtHeader: true,
      },
    });

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

    expect(output).toContain("- 格式: 纯文本");
    expect(output).toContain("- 站点: 通用");
    expect(output).toContain("- 消息数: 1");
    expect(output).toContain("你:\nSimple body");
    expect(output).not.toContain("- Format:");
    expect(output).not.toContain("You:");
  });

  test("shows only one careful rerun action in the result dialog", async () => {
    const { app } = loadApp();
    setupUiDom();

    const confirmModes = [];
    app.confirmRerunDialog = async (mode) => {
      confirmModes.push(mode);
      return true;
    };

    const pending = app.showResultDialog(
      [
        { role: "User", content: "prompt" },
        { role: "Model", content: "answer" },
      ],
      { status: "WARN", score: 75 },
      { preset: "normal" },
    );

    const labels = globalThis.document.body
      .querySelectorAll("button")
      .map((button) => button.textContent);

    expect(labels).toContain("ていねいに再実行");
    expect(labels).not.toContain("再実行");
    expect(labels).not.toContain("ていねいで再実行");

    const rerunButton = globalThis.document.body
      .querySelectorAll("button")
      .find((button) => button.textContent === "ていねいに再実行");

    expect(rerunButton).toBeDefined();
    rerunButton.click();

    await expect(pending).resolves.toEqual({ action: "rerun_careful" });
    expect(confirmModes).toEqual(["careful"]);
  });

  test("keeps the previous rerun result available and lets the user switch back to it", async () => {
    const { app } = loadApp();
    const previous = app.createResultSnapshot(
      [
        { role: "User", content: "old prompt" },
        { role: "Model", content: "old answer" },
      ],
      { status: "PASS", score: 100 },
      { preset: "normal" },
    );
    const current = app.createResultSnapshot(
      [
        { role: "User", content: "new prompt" },
        { role: "Model", content: "new answer" },
        { role: "User", content: "follow up" },
      ],
      { status: "WARN", score: 75 },
      { preset: "careful" },
    );

    const calls = [];
    app.showResultDialog = async (messages, quality, options = {}) => {
      calls.push({
        messages: messages.map((message) => message.content),
        quality,
        options,
      });

      if (calls.length === 1) {
        expect(options.alternateSnapshot.messages[0].content).toBe("old prompt");
        expect(options.alternateButtonLabel).toBe("前回結果を見る");
        return { action: "show_alternate_result" };
      }

      expect(options.alternateSnapshot.messages[0].content).toBe("new prompt");
      expect(options.alternateButtonLabel).toBe("今回結果を見る");
      return { action: "done_clipboard", saveState: "clipboard" };
    };

    const resolved = await app.resolveResultDialogChoice(current, previous);

    expect(calls).toHaveLength(2);
    expect(calls[0].messages).toEqual(["new prompt", "new answer", "follow up"]);
    expect(calls[1].messages).toEqual(["old prompt", "old answer"]);
    expect(resolved.result.action).toBe("done_clipboard");
    expect(resolved.snapshot.messages.map((message) => message.content)).toEqual([
      "old prompt",
      "old answer",
    ]);
  });

  test("uses simpler english labels when switching between rerun results", async () => {
    const { app } = loadApp({ navigatorLanguage: "en-US" });
    const previous = app.createResultSnapshot(
      [
        { role: "User", content: "old prompt" },
        { role: "Model", content: "old answer" },
      ],
      { status: "PASS", score: 100 },
      { preset: "normal" },
    );
    const current = app.createResultSnapshot(
      [
        { role: "User", content: "new prompt" },
        { role: "Model", content: "new answer" },
      ],
      { status: "WARN", score: 75 },
      { preset: "careful" },
    );

    const calls = [];
    app.showResultDialog = async (messages, quality, options = {}) => {
      calls.push({ messages, quality, options });

      if (calls.length === 1) {
        expect(options.alternateTitle).toBe("Previous result kept");
        expect(options.alternateButtonLabel).toBe("View previous result");
        return { action: "show_alternate_result" };
      }

      expect(options.alternateTitle).toBe("Current result kept");
      expect(options.alternateButtonLabel).toBe("View current result");
      return { action: "cancel" };
    };

    await app.resolveResultDialogChoice(current, previous);

    expect(calls).toHaveLength(2);
  });

  test("uses the previous rerun snapshot as the comparison base in the result dialog", async () => {
    const { app } = loadApp();
    setupUiDom();

    const previous = app.createResultSnapshot(
      [
        { role: "User", content: "old prompt" },
        { role: "Model", content: "old answer" },
      ],
      { status: "PASS", score: 100 },
      { preset: "normal" },
    );

    const pending = app.showResultDialog(
      [
        { role: "User", content: "new prompt" },
        { role: "Model", content: "new answer" },
        { role: "User", content: "follow up" },
      ],
      { status: "WARN", score: 75 },
      {
        alternateSnapshot: previous,
        alternateTitle: "再実行前の結果を保持中",
        alternateButtonLabel: "前回結果を見る",
        preset: "careful",
      },
    );

    const text = globalThis.document.body.textContent;

    expect(text).toContain("比較ベース: 前回結果（2件）");
    expect(text).toContain("前回結果: 2件 / 今回: 3件（差分 +1件）");
    expect(text).not.toContain("比較ベース: なし（保存済みなし）");
    expect(text).not.toContain("前回データなし");
    expect(text).toContain("技術詳細を見る");
    expect(text).not.toContain("SE向け詳細を見る");

    const cancelButton = globalThis.document.body
      .querySelectorAll("button")
      .find((button) => button.textContent === "中止");

    expect(cancelButton).toBeDefined();
    cancelButton.click();

    await expect(pending).resolves.toEqual({ action: "cancel" });
  });

  test("formats the english comparison base label clearly for rerun snapshots", async () => {
    const { app } = loadApp({ navigatorLanguage: "en-US" });
    setupUiDom();

    const previous = app.createResultSnapshot(
      [
        { role: "User", content: "old prompt" },
        { role: "Model", content: "old answer" },
      ],
      { status: "PASS", score: 100 },
      { preset: "normal" },
    );

    const pending = app.showResultDialog(
      [
        { role: "User", content: "new prompt" },
        { role: "Model", content: "new answer" },
        { role: "User", content: "follow up" },
      ],
      { status: "WARN", score: 75 },
      {
        alternateSnapshot: previous,
        alternateTitle: "Previous result kept",
        alternateButtonLabel: "View previous result",
        preset: "careful",
      },
    );

    const text = globalThis.document.body.textContent;

    expect(text).toContain("Comparison base: Previous result (2)");
    expect(text).not.toContain("Comparison base: Previous result 2");

    const cancelButton = globalThis.document.body
      .querySelectorAll("button")
      .find((button) => button.textContent === "Cancel");

    expect(cancelButton).toBeDefined();
    cancelButton.click();

    await expect(pending).resolves.toEqual({ action: "cancel" });
  });

  test("formats the chinese comparison base label clearly for rerun snapshots", async () => {
    const { app } = loadApp({ navigatorLanguage: "zh-CN" });
    setupUiDom();

    const previous = app.createResultSnapshot(
      [
        { role: "User", content: "old prompt" },
        { role: "Model", content: "old answer" },
      ],
      { status: "PASS", score: 100 },
      { preset: "normal" },
    );

    const pending = app.showResultDialog(
      [
        { role: "User", content: "new prompt" },
        { role: "Model", content: "new answer" },
        { role: "User", content: "follow up" },
      ],
      { status: "WARN", score: 75 },
      {
        alternateSnapshot: previous,
        alternateTitle: "已保留上一次结果",
        alternateButtonLabel: "查看上一次结果",
        preset: "careful",
      },
    );

    const text = globalThis.document.body.textContent;

    expect(text).toContain("比较基准: 上一次结果（2条）");
    expect(text).not.toContain("Comparison base: Previous result (2)");

    const cancelButton = globalThis.document.body
      .querySelectorAll("button")
      .find((button) => button.textContent === "取消");

    expect(cancelButton).toBeDefined();
    cancelButton.click();

    await expect(pending).resolves.toEqual({ action: "cancel" });
  });

  test("uses simpler english labels in the result dialog", async () => {
    const { app } = loadApp({ navigatorLanguage: "en-US" });
    setupUiDom();

    const pending = app.showResultDialog(
      [
        { role: "User", content: "prompt" },
        { role: "Model", content: "answer" },
      ],
      { status: "WARN", score: 75 },
      { preset: "normal" },
    );

    const text = globalThis.document.body.textContent;

    expect(text).toContain("Review before saving");
    expect(text).toContain("Output file name");
    expect(text).toContain("Manual copy");
    expect(text).toContain("Copy from this area");
    expect(text).toContain("Show quality details");
    expect(text).not.toContain("Saved file name");
    expect(text).not.toContain("Manual copy area (fallback)");
    expect(text).not.toContain("Copy if possible");
    expect(text.match(/Review before saving/g)?.length).toBe(1);

    const cancelButton = globalThis.document.body
      .querySelectorAll("button")
      .find((button) => button.textContent === "Cancel");

    expect(cancelButton).toBeDefined();
    cancelButton.click();

    await expect(pending).resolves.toEqual({ action: "cancel" });
  });

  test("shows chinese labels in the result dialog", async () => {
    const { app } = loadApp({ navigatorLanguage: "zh-CN" });
    setupUiDom();

    const pending = app.showResultDialog(
      [
        { role: "User", content: "prompt" },
        { role: "Model", content: "answer" },
      ],
      { status: "WARN", score: 75 },
      { preset: "normal" },
    );

    const text = globalThis.document.body.textContent;

    expect(text).toContain("保存前确认");
    expect(text).toContain("状态: 需要快速检查（75分）");
    expect(text).toContain("如果聊天很长，重新运行一次可能会更稳定。");
    expect(text).toContain("输出文件名");
    expect(text).toContain("手动复制");
    expect(text).toContain("从这里复制");
    expect(text).toContain("查看质量详情");
    expect(text).toContain("复制到剪贴板");
    expect(text).not.toContain("Needs a quick check");

    const cancelButton = globalThis.document.body
      .querySelectorAll("button")
      .find((button) => button.textContent === "取消");

    expect(cancelButton).toBeDefined();
    cancelButton.click();

    await expect(pending).resolves.toEqual({ action: "cancel" });
  });

  test("reuses the same quality wording across summary and warning labels", () => {
    const { app } = loadApp({ navigatorLanguage: "zh-CN" });
    const diff = {
      previous: { count: 2, digest: "old" },
      now: { count: 5, digest: "new" },
      diff: 3,
      rate: 0.6,
      stable: false,
      digestSame: false,
      previousLabel: "上一次结果",
      comparisonKind: "snapshot",
    };

    const summary = app.qualitySummary({ status: "WARN", score: 75 }, diff);
    const warning = app.warningSummary({ quality: { status: "WARN", score: 75 }, diff });

    expect(summary.label).toBe("需要快速检查");
    expect(summary.hint).toBe("与上一次的差异较大，滚动可能过早停止了。");
    expect(warning.text).toContain("需要快速检查");
    expect(warning.text).toContain("与上一次差异较大");
  });

  test("provides compact quality wording helpers for lightweight dialogs", () => {
    const { app } = loadApp({ navigatorLanguage: "zh-CN" });

    expect(app.qualityStatusText("WARN", true)).toBe("快速检查");
    expect(app.qualityHintText("WARN", true)).toBe("较长时可重试一次。");
    expect(app.largeDeltaHintText(true)).toBe("与上次差异大。");
    expect(app.largeDeltaLabelText()).toBe("与上一次差异较大");
  });

  test("provides compact dialog wording helpers for lightweight bookmarklets", () => {
    const { app } = loadApp({ navigatorLanguage: "zh-CN" });

    expect(app.compactDialogText("title")).toBe("保存确认");
    expect(app.compactDialogText("copy")).toBe("复制");
    expect(app.compactDialogText("save")).toBe("保存");
    expect(app.compactDialogText("copied")).toBe("已复制。");
    expect(app.compactDialogText("manual_copy_prompt")).toBe("复制失败。请从这里手动复制。");
    expect(app.compactDialogText("copy_save_failed")).toBe("复制和保存都失败。");
  });

  test("reruns carefully without persisting the preset change", async () => {
    const { app } = loadApp({
      storedConfig: {
        fmt: "std",
        preset: "normal",
        scrollMax: 32,
        scrollDelay: 220,
        autoExpand: true,
        expandMaxClicks: 24,
        expandClickDelay: 130,
        txtHeader: false,
      },
    });

    const calls = [];
    app.runOnce = async (options = {}) => {
      calls.push({ options: { ...options }, preset: app.config.preset });
      return calls.length === 1 ? { action: "rerun_careful" } : { action: "cancel" };
    };

    await app.run();

    expect(calls).toEqual([
      { options: { skipConfig: false }, preset: "normal" },
      { options: { skipConfig: true, presetOverride: "careful" }, preset: "normal" },
    ]);
    expect(app.config.preset).toBe("normal");
  });

  test("uses the effective rerun preset in export metadata when provided", () => {
    const { app } = loadApp({
      storedConfig: {
        fmt: "std",
        preset: "normal",
        scrollMax: 32,
        scrollDelay: 220,
        autoExpand: true,
        expandMaxClicks: 24,
        expandClickDelay: 130,
        txtHeader: false,
      },
    });

    const metadata = app.buildExportMetadata(
      "Format Test Chat",
      [{ role: "User", content: "prompt" }],
      { status: "PASS", score: 100 },
      { previous: null, lastAttempt: null },
      "careful",
    );

    expect(metadata.preset).toBe("careful");
    expect(app.config.preset).toBe("normal");
  });
});
