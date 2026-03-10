#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cp "${SCRIPT_DIR}/site-src/"*.md "${SCRIPT_DIR}/docs/"
echo "Synced site-src/*.md -> docs/"
