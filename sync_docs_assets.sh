#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cp "${SCRIPT_DIR}/ai-chat-export.min.js" "${SCRIPT_DIR}/docs/ai-chat-export.min.js"
cp "${SCRIPT_DIR}/ai-chat-export.public.min.js" "${SCRIPT_DIR}/docs/ai-chat-export.public.min.js"
cp "${SCRIPT_DIR}/ai-chat-export.public.oneliner.js" "${SCRIPT_DIR}/docs/ai-chat-export.public.oneliner.js"
cp "${SCRIPT_DIR}/ai-chat-export.github-pages.oneliner.js" "${SCRIPT_DIR}/docs/ai-chat-export.github-pages.oneliner.js"
cp "${SCRIPT_DIR}/ai-chat-export.github-pages.fetch-loader.oneliner.js" "${SCRIPT_DIR}/docs/ai-chat-export.github-pages.fetch-loader.oneliner.js"
echo "Synced docs/ai-chat-export.min.js"
