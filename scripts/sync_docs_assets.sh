#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

mkdir -p "${ROOT_DIR}/docs"
cp "${ROOT_DIR}/dist/ai-chat-export.min.js" "${ROOT_DIR}/docs/ai-chat-export.min.js"
cp "${ROOT_DIR}/ai-chat-export.bookmarklet.oneliner.js" "${ROOT_DIR}/docs/ai-chat-export.bookmarklet.oneliner.js"
cp "${ROOT_DIR}/dist/ai-chat-export.public.min.js" "${ROOT_DIR}/docs/ai-chat-export.public.min.js"
cp "${ROOT_DIR}/ai-chat-export.public.oneliner.js" "${ROOT_DIR}/docs/ai-chat-export.public.oneliner.js"
cp "${ROOT_DIR}/loaders/ai-chat-export.github-pages.oneliner.js" "${ROOT_DIR}/docs/ai-chat-export.github-pages.oneliner.js"
cp "${ROOT_DIR}/loaders/ai-chat-export.github-pages.fetch-loader.oneliner.js" "${ROOT_DIR}/docs/ai-chat-export.github-pages.fetch-loader.oneliner.js"
echo "Synced docs/ai-chat-export.min.js"
