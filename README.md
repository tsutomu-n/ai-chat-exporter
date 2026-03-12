# AI Chat Export

Bookmarklet-based exporter for long AI chat sessions such as ChatGPT, Grok, and Google AI Studio.

## Recommended Files

- `ai-chat-export.chatgpt-claude.bookmarklet.oneliner.js`
  - Recommended for ChatGPT and Claude
- `ai-chat-export.aistudio-grok.bookmarklet.oneliner.js`
  - Recommended for Google AI Studio and Grok
- `ai-chat-export.claude.bookmarklet.oneliner.js`
  - Smallest Claude-only build

Integrated builds are also available:

- `ai-chat-export.bookmarklet.oneliner.js`
- `ai-chat-export.unified.bookmarklet.oneliner.js`
  - compact integrated build with a simpler result dialog
  - more bookmark-editor-friendly on Firefox

`ai-chat-export.bookmarklet.oneliner.js` can still be too long for some bookmark editors. If you want one integrated file, try `ai-chat-export.unified.bookmarklet.oneliner.js` first. In practice, the split variants are still the safest.

## What It Does

- walks long chats from top to bottom
- expands folded content such as `Show more`
- exports readable `Markdown` or `Plain Text`
- shows a quality check before saving
- supports file save and clipboard copy

## Quick Start

1. Open `ai-chat-export.chatgpt-claude.bookmarklet.oneliner.js` or `ai-chat-export.aistudio-grok.bookmarklet.oneliner.js`
2. Copy the entire line into a browser bookmark URL field
3. Run it on a supported chat page

## Repository Layout

- `ai-chat-export.bookmarklet.oneliner.js`
  - ASCII unified bookmarklet
- `ai-chat-export.unified.bookmarklet.oneliner.js`
  - compact ASCII unified bookmarklet
  - Firefox-friendlier integrated build
- `ai-chat-export.chatgpt-claude.bookmarklet.oneliner.js`
  - recommended for ChatGPT and Claude
- `ai-chat-export.aistudio-grok.bookmarklet.oneliner.js`
  - recommended for Google AI Studio and Grok
- `ai-chat-export.claude.bookmarklet.oneliner.js`
  - Claude-only shortest build
- `src/ai-chat-export.js`
  - readable source
- `archive/README.ja.md`
  - legacy builds, experimental variants, and developer-only outputs

## Supported Sites

- `chatgpt.com` / `chat.openai.com`
- `claude.ai`
- Grok domains and `x.com/i/grok`
- `aistudio.google.com`
- Some `gemini` and `deepseek` domains

## Docs

- `docs/README.ja.md`
- `docs/public-bookmarklet.ja.md`

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
