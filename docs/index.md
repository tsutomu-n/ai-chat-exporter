# AI Chat Export Guide

[Japanese guide](./index.ja.md) | [Chinese guide](./index.zh-CN.md)

## Start with these files

- `./ai-chat-export.chrome.ja.bookmarklet.oneliner.js`
  - Japanese variant for Chrome / Chromium
- `./ai-chat-export.chrome.en.bookmarklet.oneliner.js`
  - English variant for Chrome / Chromium
- `./ai-chat-export.chrome.zh-CN.bookmarklet.oneliner.js`
  - Simplified Chinese variant for Chrome / Chromium
- `./ai-chat-export.firefox.ja.bookmarklet.oneliner.js`
  - Japanese variant for Firefox
- `./ai-chat-export.firefox.en.bookmarklet.oneliner.js`
  - English variant for Firefox
- `./ai-chat-export.firefox.zh-CN.bookmarklet.oneliner.js`
  - Simplified Chinese variant for Firefox

This public repo mainly ships these six bookmarklet files.
The distributed bookmarklets use a compact result screen and do not include the full save preview from the readable source UI. Each file has a fixed language, and the Firefox builds are smaller still so they stay within Firefox bookmark limits.

## Basic usage

1. Open the bookmarklet file that matches your browser and language
2. Copy the whole file content into a bookmark URL field
3. Run the bookmarklet on a supported conversation page
4. Choose the run mode and output format
5. Review the quality status and save to file or clipboard

## Run modes

- `Fast`
  - Best for short conversations. Stops earlier.
- `Normal`
  - Default. Best for everyday use.
- `Careful`
  - Best for long conversations. Scrolls more and opens more hidden content.

If a chat is long or the quality status shows `WARN` or `FAIL`, rerun with `Careful`.

## Output formats

- `Markdown`
  - Readable format for normal `.md` files
- `Plain text`
  - Lightweight format with most Markdown syntax removed

`Plain text` can be exported with or without the conversation header.

## Quality status

- `PASS`
  - No clear problem was found.
- `WARN`
  - Missing content or a large delta is possible. Try `Careful` first.
- `FAIL`
  - Rerunning before saving is recommended.

The quality status is based on extraction counts and comparison against previous saves.

## Save options

- `Save file`
  - Saves directly to a local file
- `Copy to clipboard`
  - Best when you want to paste immediately

If clipboard write is blocked by the browser, the tool shows a manual copy area.

## What is under `docs/`

- `ai-chat-export.chrome.ja.bookmarklet.oneliner.js`
- `ai-chat-export.chrome.en.bookmarklet.oneliner.js`
- `ai-chat-export.chrome.zh-CN.bookmarklet.oneliner.js`
- `ai-chat-export.firefox.ja.bookmarklet.oneliner.js`
- `ai-chat-export.firefox.en.bookmarklet.oneliner.js`
- `ai-chat-export.firefox.zh-CN.bookmarklet.oneliner.js`
- `index.md`
- `index.ja.md`
- `index.zh-CN.md`

This `docs/` directory ships only the public bookmarklets and the usage guides.

## Source and distribution

- `src/ai-chat-export.js`
  - Readable source
- `ai-chat-export.chrome.ja.bookmarklet.oneliner.js` / `ai-chat-export.chrome.en.bookmarklet.oneliner.js` / `ai-chat-export.chrome.zh-CN.bookmarklet.oneliner.js`
  - Chrome / Chromium distribution bookmarklets
- `ai-chat-export.firefox.ja.bookmarklet.oneliner.js` / `ai-chat-export.firefox.en.bookmarklet.oneliner.js` / `ai-chat-export.firefox.zh-CN.bookmarklet.oneliner.js`
  - Firefox distribution bookmarklets

The distribution files are regenerated with `scripts/generate_oneline_bookmarklet.sh`.
