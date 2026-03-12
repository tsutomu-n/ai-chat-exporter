# AI Chat Export

Bookmarklet-based exporter for long AI chat sessions such as ChatGPT, Grok, and Google AI Studio.

## Recommended Files

- `ai-chat-export.chrome.bookmarklet.oneliner.js`
  - Integrated build for Chrome / Chromium browsers
- `ai-chat-export.firefox.bookmarklet.oneliner.js`
  - Compact integrated build for Firefox
  - Simpler result dialog and shorter bookmark payload

Specialized split variants are kept in `archive/README.ja.md` only.

## What It Does

- walks long chats from top to bottom
- expands folded content such as `Show more`
- exports readable `Markdown` or `Plain Text`
- shows a quality check before saving
- supports file save and clipboard copy

## Quick Start

1. Open `ai-chat-export.chrome.bookmarklet.oneliner.js` on Chrome / Chromium, or `ai-chat-export.firefox.bookmarklet.oneliner.js` on Firefox
2. Copy the entire line into a browser bookmark URL field
3. Run it on a supported chat page

## Repository Layout

- `ai-chat-export.chrome.bookmarklet.oneliner.js`
  - ASCII unified bookmarklet for Chrome / Chromium
- `ai-chat-export.firefox.bookmarklet.oneliner.js`
  - compact ASCII unified bookmarklet for Firefox
- `src/ai-chat-export.js`
  - readable source
- `archive/README.ja.md`
  - archived split builds, experimental variants, and developer-only outputs

## Supported Sites

- `chatgpt.com` / `chat.openai.com`
- `claude.ai`
- Grok domains and `x.com/i/grok`
- `aistudio.google.com`
- Some `gemini` and `deepseek` domains

## Docs

- `docs/README.ja.md`
- `docs/codex-cli-frontend-setup.ja.md`

## Development

Regenerate outputs:

```bash
bash scripts/generate_oneline_bookmarklet.sh
```

Sync docs assets:

```bash
bash scripts/sync_docs_assets.sh
bash scripts/sync_site_docs.sh
```

## License

MIT
