# AI Chat Export

Bookmarklet-based exporter for long AI chat sessions such as ChatGPT, Grok, and Google AI Studio.

## Start Here

- `ai-chat-export.bookmarklet.oneliner.js`
  - The only primary distribution file
  - Short enough for real browser bookmark editors
  - Self-contained, so it does not rely on external `fetch` or `script src`

## What It Does

- walks long chats from top to bottom
- expands folded content such as `Show more`
- exports readable `Markdown` or `Plain Text`
- shows a quality check before saving
- supports file save and clipboard copy

## Quick Start

1. Open `ai-chat-export.bookmarklet.oneliner.js`
2. Copy the entire line into a browser bookmark URL field
3. Run it on a supported chat page

## Repository Layout

- `ai-chat-export.bookmarklet.oneliner.js`
  - active bookmarklet
- `src/ai-chat-export.js`
  - readable source
- `archive/README.ja.md`
  - legacy builds, experimental variants, and developer-only outputs

## Supported Sites

- `chatgpt.com` / `chat.openai.com`
- Grok domains and `x.com/i/grok`
- `aistudio.google.com`
- Some `claude`, `gemini`, and `deepseek` domains

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
