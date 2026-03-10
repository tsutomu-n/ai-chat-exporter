# AI Chat Export

Bookmarklet-based exporter for long AI chat sessions such as ChatGPT, Grok, and Google AI Studio.

## Recommended Files

- `ai-chat-export.public.oneliner.js`
  - Recommended self-contained bookmarklet
- `ai-chat-export.public.min.js`
  - DevTools Console / Snippets version

The `public` variants do not rely on external `fetch` or external `script src`, so they are more reliable on CSP-restricted sites like ChatGPT.

## Quick Start

1. Open `ai-chat-export.public.oneliner.js`
2. Copy the entire line into a browser bookmark URL field
3. Run it on a chat page

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
./generate_oneline_bookmarklet.sh
```

Sync docs assets:

```bash
./sync_docs_assets.sh
./sync_site_docs.sh
```

## License

MIT
