import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = path.join(repoRoot, "src", "ai-chat-export.js");

class StubNode {
  constructor(nodeType, ownerDocument = null) {
    this.nodeType = nodeType;
    this.ownerDocument = ownerDocument;
    this.parentNode = null;
    this.parentElement = null;
    this.childNodes = [];
  }

  appendChild(child) {
    child.parentNode = this;
    if (child.nodeType === 1) child.parentElement = this.nodeType === 1 ? this : null;
    child.ownerDocument = this.ownerDocument;
    this.childNodes.push(child);
    return child;
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
      this.appendChild(new StubText(String(value), this.ownerDocument));
    }
  }

  get innerText() {
    return this.textContent;
  }
}

class StubText extends StubNode {
  constructor(text, ownerDocument) {
    super(3, ownerDocument);
    this._text = String(text ?? "");
  }
}

class StubElement extends StubNode {
  constructor(tagName, ownerDocument, { attrs = {}, text = "", queryMap = {} } = {}) {
    super(1, ownerDocument);
    this.tagName = String(tagName).toUpperCase();
    this.attributes = new Map();
    this.style = { cssText: "" };
    this.shadowRoot = null;
    this.className = "";
    this.id = "";
    this._queryMap = new Map(Object.entries(queryMap));

    for (const [name, value] of Object.entries(attrs)) {
      this.setAttribute(name, value);
    }
    if (text) this.appendChild(new StubText(text, ownerDocument));
  }

  setAttribute(name, value) {
    const next = String(value);
    this.attributes.set(name, next);
    if (name === "class") this.className = next;
    if (name === "id") this.id = next;
  }

  getAttribute(name) {
    return this.attributes.has(name) ? this.attributes.get(name) : null;
  }

  querySelectorAll(selector) {
    return this._queryMap.get(selector) || [];
  }

  querySelector(selector) {
    return this.querySelectorAll(selector)[0] || null;
  }
}

function createDocument({ title = "Claude Conversation", queryMap = {} } = {}) {
  const document = {
    title,
    body: {
      appendChild() {},
    },
    querySelector(selector) {
      return (queryMap[selector] || [])[0] || null;
    },
    querySelectorAll(selector) {
      return queryMap[selector] || [];
    },
    createTextNode(text) {
      return new StubText(text, document);
    },
  };
  return document;
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
    pathname: "/c/test-chat",
    href: "https://example.com/c/test-chat",
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
  globalThis.Element = StubElement;
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

describe("Claude adapter", () => {
  test("matches claude.ai and extracts user/model messages", () => {
    const document = createDocument();
    const title = new StubElement("h1", document, { text: "Claude Project Chat" });
    const userMessage = new StubElement("div", document, {
      attrs: { "data-testid": "user-message", "data-message-id": "u1" },
      text: "ユーザーの質問",
    });
    const modelMessage = new StubElement("div", document, {
      attrs: { "data-testid": "assistant-message", "data-message-id": "a1" },
      text: "Claude の回答",
    });

    document.querySelector = (selector) => {
      if (selector === 'main h1, header h1, [data-testid="conversation-title"], [data-testid="chat-title"]') {
        return title;
      }
      return null;
    };
    document.querySelectorAll = (selector) => {
      if (
        selector ===
        '[data-message-author-role], [data-testid="user-message"], [data-testid="human-message"], [data-testid="assistant-message"], [data-testid="claude-message"], [data-testid="model-message"], div.font-claude-response'
      ) {
        return [userMessage, modelMessage];
      }
      return [];
    };

    const app = loadApp({
      locationOverride: {
        hostname: "claude.ai",
        origin: "https://claude.ai",
        pathname: "/chat/abc123",
        href: "https://claude.ai/chat/abc123",
      },
      documentOverride: document,
    });

    expect(app.adapter.id).toBe("claude");
    expect(app.adapter.label).toBe("Claude");
    expect(app.adapter.getConversationKey()).toBe("https://claude.ai/chat/abc123");
    expect(app.adapter.getTitle()).toBe("Claude Project Chat");
    expect(app.adapter.extractMessages()).toEqual([
      { role: "User", content: "ユーザーの質問", sig: "id:u1" },
      { role: "Model", content: "Claude の回答", sig: "id:a1" },
    ]);
  });

  test("does not reduce quality score only because Claude lacks strong message ids", () => {
    const app = loadApp({
      locationOverride: {
        hostname: "claude.ai",
        origin: "https://claude.ai",
        pathname: "/chat/quality-case",
        href: "https://claude.ai/chat/quality-case",
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
        weakIdentityMessages: 6,
      },
      policy,
    );

    expect(quality.score).toBe(100);
    expect(quality.status).toBe("PASS");
  });

  test("falls back when explicit selectors only find user messages", () => {
    const document = createDocument();
    const explicitUser = new StubElement("div", document, {
      attrs: { "data-testid": "user-message", "data-message-id": "u1" },
      text: "ユーザーの質問",
    });
    const fallbackUser = new StubElement("article", document, {
      attrs: { "data-message-author-role": "user", "data-message-id": "u1" },
      text: "ユーザーの質問",
    });
    const fallbackModel = new StubElement("article", document, {
      attrs: { "data-message-author-role": "assistant", "data-message-id": "a1" },
      text: "Claude の回答",
    });

    document.querySelectorAll = (selector) => {
      if (
        selector ===
        '[data-message-author-role], [data-testid="user-message"], [data-testid="human-message"], [data-testid="assistant-message"], [data-testid="claude-message"], [data-testid="model-message"], div.font-claude-response'
      ) {
        return [explicitUser];
      }
      if (selector === 'main [data-message-id], main [data-testid*="message"], main article, main section') {
        return [fallbackUser, fallbackModel];
      }
      return [];
    };

    const app = loadApp({
      locationOverride: {
        hostname: "claude.ai",
        origin: "https://claude.ai",
        pathname: "/chat/fallback-case",
        href: "https://claude.ai/chat/fallback-case",
      },
      documentOverride: document,
    });

    expect(app.adapter.extractMessages()).toEqual([
      { role: "User", content: "ユーザーの質問", sig: "id:u1" },
      { role: "Model", content: "Claude の回答", sig: "id:a1" },
    ]);
  });

  test("extracts Claude responses from font-claude-response containers", () => {
    const document = createDocument();
    const userMessage = new StubElement("div", document, {
      attrs: { "data-testid": "user-message" },
      text: "ユーザーの質問",
    });
    const modelMessage = new StubElement("div", document, {
      attrs: { class: "font-claude-response relative leading-[1.65rem]" },
      text: "Claude の回答",
    });

    document.querySelectorAll = (selector) => {
      if (
        selector ===
        '[data-message-author-role], [data-testid="user-message"], [data-testid="human-message"], [data-testid="assistant-message"], [data-testid="claude-message"], [data-testid="model-message"], div.font-claude-response'
      ) {
        return [userMessage, modelMessage];
      }
      return [];
    };

    const app = loadApp({
      locationOverride: {
        hostname: "claude.ai",
        origin: "https://claude.ai",
        pathname: "/chat/class-based-model",
        href: "https://claude.ai/chat/class-based-model",
      },
      documentOverride: document,
    });

    expect(app.adapter.extractMessages()).toEqual([
      { role: "User", content: "ユーザーの質問", sig: "testid:user-message:ff0987e" },
      { role: "Model", content: "Claude の回答", sig: "p:div:nth-of-type(1)" },
    ]);
  });
});
