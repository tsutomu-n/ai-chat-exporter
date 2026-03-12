#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

mkdir -p "${ROOT_DIR}/docs"
find "${ROOT_DIR}/docs" -maxdepth 1 -type f -name '*.md' -delete
cp "${ROOT_DIR}/docs-src/"*.md "${ROOT_DIR}/docs/"
echo "Synced docs-src/*.md -> docs/"
