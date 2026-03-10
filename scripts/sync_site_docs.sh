#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

mkdir -p "${ROOT_DIR}/docs"
cp "${ROOT_DIR}/docs-src/"*.md "${ROOT_DIR}/docs/"
echo "Synced docs-src/*.md -> docs/"
