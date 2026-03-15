import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = path.join(repoRoot, "src", "ai-chat-export.js");

function createDocument({ title = "Grok Conversation" } = {}) {
  return {
    title,
    body: {
      appendChild() {},
    },
    querySelector() {
      return null;
    },
    querySelectorAll() {
      return [];
    },
    createTextNode(text) {
      return { nodeType: 3, textContent: String(text ?? "") };
    },
  };
}

class StubElement {
  constructor(tagName, { attrs = {}, text = "", className = "", queryMap = {} } = {}) {
    this.nodeType = 1;
    this.tagName = String(tagName).toUpperCase();
    this.attributes = new Map();
    this.className = className;
    this.id = "";
    this.dataset = {};
    this.childNodes = [];
    this.children = [];
    this.shadowRoot = null;
    this.parentElement = null;
    this._queryMap = new Map(Object.entries(queryMap));
    this.innerText = text;
    this.textContent = text;
    if (text) {
      const textNode = { nodeType: 3, textContent: text, parentElement: this };
      this.childNodes.push(textNode);
    }

    for (const [name, value] of Object.entries(attrs)) {
      this.setAttribute(name, value);
    }
  }

  appendChild(child) {
    if (!child) return child;
    child.parentElement = this;
    this.childNodes.push(child);
    if (child.nodeType === 1) this.children.push(child);
    return child;
  }

  setAttribute(name, value) {
    const next = String(value);
    this.attributes.set(name, next);
    if (name === "id") this.id = next;
    if (name.startsWith("data-")) {
      const dataKey = name
        .slice(5)
        .replace(/-([a-z])/g, (_, ch) => ch.toUpperCase());
      this.dataset[dataKey] = next;
    }
  }

  getAttribute(name) {
    return this.attributes.has(name) ? this.attributes.get(name) : null;
  }

  querySelectorAll(selector) {
    if (this._queryMap.has(selector)) return this._queryMap.get(selector) || [];

    const selectors = selector.split(",").map((part) => part.trim()).filter(Boolean);
    const matches = [];
    const visit = (node) => {
      if (!node || node.nodeType !== 1) return;
      if (selectors.some((part) => matchesSelector(node, part))) matches.push(node);
      for (const child of node.children || []) visit(child);
    };
    for (const child of this.children) visit(child);
    return matches;
  }

  querySelector(selector) {
    return this.querySelectorAll(selector)[0] || null;
  }

  get previousElementSibling() {
    if (!this.parentElement) return null;
    const siblings = this.parentElement.children || [];
    const index = siblings.indexOf(this);
    return index > 0 ? siblings[index - 1] : null;
  }

  closest(selector) {
    let node = this;
    while (node) {
      if (matchesSelector(node, selector)) return node;
      node = node.parentElement;
    }
    return null;
  }
}

function matchesSelector(el, selector) {
  const match = selector.match(/^([a-zA-Z0-9_-]+)(?:\[([^=\]]+)=["']?(.*?)["']?\])?$/);
  if (!match) return false;
  const [, tag, attrName, attrValue] = match;
  if (tag && el.tagName.toLowerCase() !== tag.toLowerCase()) return false;
  if (!attrName) return true;
  return el.getAttribute(attrName) === attrValue;
}

function loadApp({ locationOverride = {}, documentOverride } = {}) {
  const source = readFileSync(sourcePath, "utf8")
    .replace(/^javascript:/, "")
    .replace(
      /const app = new App\(\);\s*await app\.run\(\);\s*\n\s*\}\)\(\);\s*$/m,
      "globalThis.__AI_CHAT_EXPORT_TEST__ = { App, ScrollEngine };\n})();",
    );

  globalThis.window = globalThis;
  globalThis.location = {
    hostname: "example.com",
    origin: "https://example.com",
    pathname: "/",
    href: "https://example.com/",
    search: "",
    ...locationOverride,
  };
  globalThis.localStorage = {
    getItem() {
      return null;
    },
    setItem() {},
    removeItem() {},
  };
  globalThis.document = documentOverride || createDocument();
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

  return new globalThis.__AI_CHAT_EXPORT_TEST__.App();
}

describe("Grok adapter", () => {
  test("matches x.com/i/grok conversation URLs", () => {
    const app = loadApp({
      locationOverride: {
        hostname: "x.com",
        origin: "https://x.com",
        pathname: "/i/grok",
        href: "https://x.com/i/grok?conversation=2032763008074789060",
        search: "?conversation=2032763008074789060",
      },
    });

    expect(app.adapter.id).toBe("grok");
    expect(app.adapter.getConversationKey()).toBe(
      "https://x.com/i/grok?conversation=2032763008074789060",
    );
  });

  test("matches bare x.com/i/grok URLs", () => {
    const app = loadApp({
      locationOverride: {
        hostname: "x.com",
        origin: "https://x.com",
        pathname: "/i/grok",
        href: "https://x.com/i/grok",
        search: "",
      },
    });

    expect(app.adapter.id).toBe("grok");
    expect(app.adapter.getConversationKey()).toBe("https://x.com/i/grok");
  });

  test("does not reduce quality score only because Grok lacks strong message ids", () => {
    const app = loadApp({
      locationOverride: {
        hostname: "x.com",
        origin: "https://x.com",
        pathname: "/i/grok",
        href: "https://x.com/i/grok?conversation=2032763008074789060",
        search: "?conversation=2032763008074789060",
      },
    });

    const policy = app.adapter.getQualityPolicy?.() || {};
    const quality = globalThis.__AI_CHAT_EXPORT_TEST__.ScrollEngine.buildQuality(
      {
        topReached: true,
        topStableHits: 3,
        topSettleStableHits: 0,
        stableTarget: 3,
        topEarlyExit: false,
        bottomReached: true,
        bottomStableHits: 3,
        bottomEarlyExit: false,
        isFastPreset: false,
        finalStableHits: 2,
        finalNewMessages: 0,
        weakIdentityMessages: 8,
      },
      policy,
    );

    expect(quality.score).toBe(100);
    expect(quality.status).toBe("PASS");
  });

  test("extracts x.com style Grok conversation containers", () => {
    const userBubble = new StubElement("div", { text: "ユーザー入力" });
    const modelBubble = new StubElement("div", { text: "Grokの返答" });
    const userMessage = new StubElement("article", {
      attrs: { "data-testid": "conversation-turn-user-1", "data-id": "u1" },
      className: "css-1dbjc4n items-end",
      text: "ユーザー入力",
      queryMap: {
        ".message-bubble": [userBubble],
      },
    });
    const modelMessage = new StubElement("article", {
      attrs: { "data-testid": "conversation-turn-model-1", "data-id": "m1" },
      className: "css-1dbjc4n items-start",
      text: "Grokの返答",
      queryMap: {
        ".message-bubble": [modelBubble],
      },
    });
    const document = createDocument();
    document.querySelectorAll = (selector) => {
      if (selector === '[data-message-author-role]') return [];
      if (selector === 'div[id^="response-"]') return [];
      if (
        selector ===
        'main article, main [data-testid^="conversation-turn-"], main [data-testid*="grok"], main section'
      ) {
        return [userMessage, modelMessage];
      }
      return [];
    };

    const app = loadApp({
      locationOverride: {
        hostname: "x.com",
        origin: "https://x.com",
        pathname: "/i/grok",
        href: "https://x.com/i/grok?conversation=2032763008074789060",
        search: "?conversation=2032763008074789060",
      },
      documentOverride: document,
    });

    expect(app.adapter.id).toBe("grok");
    expect(app.adapter.extractMessages()).toEqual([
      { role: "User", content: "ユーザー入力", sig: "id:u1" },
      { role: "Model", content: "Grokの返答", sig: "id:m1" },
    ]);
  });

  test("extracts x.com grok turns from action-button anchored layout", () => {
    const user1 = new StubElement("div", { attrs: { id: "u1" }, text: "ide windsurfで今日現在AIモデルを選ぶにはどうすればいい" });
    const model1 = new StubElement("div", { attrs: { id: "m1" }, text: "Windsurf のモデル選択は Cascade パネルから行います。" });
    const sources1 = new StubElement("div", { text: "38 web pages" });
    const copy1 = new StubElement("button", { attrs: { "aria-label": "Copy text" } });
    const share1 = new StubElement("button", { attrs: { "aria-label": "Share" } });
    const actions1 = new StubElement("div");
    actions1.appendChild(copy1);
    actions1.appendChild(share1);
    const turn1 = new StubElement("div");
    turn1.appendChild(user1);
    turn1.appendChild(model1);
    turn1.appendChild(sources1);
    turn1.appendChild(actions1);

    const user2 = new StubElement("div", { attrs: { id: "u2" }, text: "proを使っているが、今までのように多様なモデルを選べなくなった" });
    const model2 = new StubElement("div", { attrs: { id: "m2" }, text: "最近は SWE-1 系が前面に出るため、外部モデルが見えにくいことがあります。" });
    const regen2 = new StubElement("button", { attrs: { "aria-label": "Regenerate" } });
    const copy2 = new StubElement("button", { attrs: { "aria-label": "Copy text" } });
    const actions2 = new StubElement("div");
    actions2.appendChild(regen2);
    actions2.appendChild(copy2);
    const turn2 = new StubElement("div");
    turn2.appendChild(user2);
    turn2.appendChild(model2);
    turn2.appendChild(actions2);

    const document = createDocument();
    document.querySelectorAll = (selector) => {
      if (selector === '[data-message-author-role]') return [];
      if (selector === 'div[id^="response-"]') return [];
      if (selector === 'button[aria-label="Copy text"], button[aria-label="Regenerate"]') {
        return [copy1, regen2, copy2];
      }
      if (
        selector ===
        'main article, main [data-testid^="conversation-turn-"], main [data-testid*="grok"], main section'
      ) {
        return [];
      }
      return [];
    };

    const app = loadApp({
      locationOverride: {
        hostname: "x.com",
        origin: "https://x.com",
        pathname: "/i/grok",
        href: "https://x.com/i/grok?conversation=1991834377618145589",
        search: "?conversation=1991834377618145589",
      },
      documentOverride: document,
    });

    expect(app.adapter.id).toBe("grok");
    expect(app.adapter.extractMessages()).toEqual([
      { role: "User", content: "ide windsurfで今日現在AIモデルを選ぶにはどうすればいい", sig: "id:u1" },
      { role: "Model", content: "Windsurf のモデル選択は Cascade パネルから行います。", sig: "id:m1" },
      { role: "User", content: "proを使っているが、今までのように多様なモデルを選べなくなった", sig: "id:u2" },
      { role: "Model", content: "最近は SWE-1 系が前面に出るため、外部モデルが見えにくいことがあります。", sig: "id:m2" },
    ]);
  });
});
