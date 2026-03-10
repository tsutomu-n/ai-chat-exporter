#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cp "${SCRIPT_DIR}/ai-chat-export.min.js" "${SCRIPT_DIR}/docs/ai-chat-export.min.js"
echo "Synced docs/ai-chat-export.min.js"
