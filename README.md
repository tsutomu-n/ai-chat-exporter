# AI Chat Export

Bookmarklet-based exporter for long AI chat sessions such as ChatGPT, Grok, and Google AI Studio, with Markdown, JSON, and plain-text outputs.

## Start Here

- `ai-chat-export.bookmarklet.oneliner.js`
  - Recommended bookmarklet for real browser bookmark editors
- `ai-chat-export.public.oneliner.js`
  - Feature-rich self-contained bookmarklet
  - Use this when you want the richer result dialog and your browser can save longer bookmarklets

`ai-chat-export.bookmarklet.oneliner.js` is the shortest root bookmarklet and is the first thing to try when a browser bookmark editor truncates long URLs. It is the same build as `variants/ai-chat-export.public.minimal.oneliner.js`.

`ai-chat-export.public.oneliner.js` stays available as the fuller self-contained build. Both avoid external `fetch` and external `script src`, so they work better on CSP-restricted sites like ChatGPT.

## Quick Start

1. Open `ai-chat-export.bookmarklet.oneliner.js`
2. Copy the entire line into a browser bookmark URL field
3. Run it on a chat page

## Developer Files

- `dist/ai-chat-export.public.min.js`
  - DevTools Console / Snippets version
- `dist/ai-chat-export.min.js`
  - Minified main script for GitHub Pages hosting
- `dist/ai-chat-export.oneliner.js`
  - Non-public one-line bookmarklet build
- `loaders/ai-chat-export.github-pages.oneliner.js`
  - `script src` loader bookmarklet
- `loaders/ai-chat-export.github-pages.fetch-loader.oneliner.js`
  - `fetch + eval` loader bookmarklet
- `src/ai-chat-export.js`
  - Readable source

## Supported Sites

- `chatgpt.com` / `chat.openai.com`
- Grok domains and `x.com/i/grok`
- `aistudio.google.com`
- Some `claude`, `gemini`, and `deepseek` domains

## Docs

- `docs/public-bookmarklet.ja.md`
- `docs/bookmarklet-loader.ja.md`
- `docs/github-pages-setup.ja.md`

## Screenshots

Store UI screenshots in `assets/screenshots/`.

- Screenshot guide: `assets/README.ja.md`
- Recommended captures:
  1. [Bookmark edit dialog](assets/screenshots/01-bookmark-edit.png)
  2. [Run configuration dialog](assets/screenshots/02-config-dialog.png)
  3. [Careful-mode progress dialog](assets/screenshots/03-careful-progress.png)
  4. [Quality / result dialog](assets/screenshots/04-quality-dialog.png)
  5. [Exported Markdown example](assets/screenshots/05-exported-markdown.png)

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
