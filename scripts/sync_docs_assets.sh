#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

mkdir -p "${ROOT_DIR}/docs"
cp "${ROOT_DIR}/ai-chat-export.chrome.ja.bookmarklet.oneliner.js" "${ROOT_DIR}/docs/ai-chat-export.chrome.ja.bookmarklet.oneliner.js"
cp "${ROOT_DIR}/ai-chat-export.chrome.en.bookmarklet.oneliner.js" "${ROOT_DIR}/docs/ai-chat-export.chrome.en.bookmarklet.oneliner.js"
cp "${ROOT_DIR}/ai-chat-export.chrome.zh-CN.bookmarklet.oneliner.js" "${ROOT_DIR}/docs/ai-chat-export.chrome.zh-CN.bookmarklet.oneliner.js"
cp "${ROOT_DIR}/ai-chat-export.firefox.ja.bookmarklet.oneliner.js" "${ROOT_DIR}/docs/ai-chat-export.firefox.ja.bookmarklet.oneliner.js"
cp "${ROOT_DIR}/ai-chat-export.firefox.en.bookmarklet.oneliner.js" "${ROOT_DIR}/docs/ai-chat-export.firefox.en.bookmarklet.oneliner.js"
cp "${ROOT_DIR}/ai-chat-export.firefox.zh-CN.bookmarklet.oneliner.js" "${ROOT_DIR}/docs/ai-chat-export.firefox.zh-CN.bookmarklet.oneliner.js"
rm -f \
  "${ROOT_DIR}"/docs/ai-chat-export.{chrome,firefox}.bookmarklet.oneliner.js \
  "${ROOT_DIR}/docs/ai-chat-export.bookmarklet.oneliner.js" \
  "${ROOT_DIR}/docs/ai-chat-export.unified.bookmarklet.oneliner.js" \
  "${ROOT_DIR}/docs/ai-chat-export.min.js" \
  "${ROOT_DIR}/docs/ai-chat-export.github-pages.oneliner.js" \
  "${ROOT_DIR}/docs/ai-chat-export.github-pages.fetch-loader.oneliner.js"
echo "Synced docs language-specific browser bookmarklets"
