#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
SRC="${ROOT_DIR}/src/ai-chat-export.js"
MIN_OUT="${ROOT_DIR}/dist/ai-chat-export.min.js"
OUT="${ROOT_DIR}/dist/ai-chat-export.oneliner.js"
PUBLIC_MIN_OUT="${ROOT_DIR}/dist/ai-chat-export.public.min.js"
PUBLIC_OUT="${ROOT_DIR}/ai-chat-export.public.oneliner.js"
export BUN_TMPDIR="${BUN_TMPDIR:-${TMPDIR:-/tmp}}"
export BUN_INSTALL="${BUN_INSTALL:-${BUN_TMPDIR%/}/bun-install}"
TMP_BODY="$(mktemp "${TMPDIR:-/tmp}/ai-chat-export.body.XXXXXX.js")"
TMP_MIN="$(mktemp "${TMPDIR:-/tmp}/ai-chat-export.min.XXXXXX.js")"
TMP_PUBLIC_MIN="$(mktemp "${TMPDIR:-/tmp}/ai-chat-export.public.min.XXXXXX.js")"

cleanup() {
  rm -f "${TMP_BODY}" "${TMP_MIN}" "${TMP_PUBLIC_MIN}"
}
trap cleanup EXIT

perl -0pe 's/^javascript://' "${SRC}" > "${TMP_BODY}"
if command -v bunx >/dev/null 2>&1; then
  bunx terser "${TMP_BODY}" --compress --mangle --format ascii_only=true --output "${TMP_MIN}"
  bunx terser "${TMP_BODY}" --compress 'passes=3,toplevel=true' --mangle 'toplevel=true' --format ascii_only=true --output "${TMP_PUBLIC_MIN}"
else
  npx --yes terser "${TMP_BODY}" --compress --mangle --format ascii_only=true --output "${TMP_MIN}"
  npx --yes terser "${TMP_BODY}" --compress 'passes=3,toplevel=true' --mangle 'toplevel=true' --format ascii_only=true --output "${TMP_PUBLIC_MIN}"
fi
cp "${TMP_MIN}" "${MIN_OUT}"
cp "${TMP_PUBLIC_MIN}" "${PUBLIC_MIN_OUT}"

node - "${TMP_MIN}" "${OUT}" "${TMP_PUBLIC_MIN}" "${PUBLIC_OUT}" <<'NODE'
const fs = require('fs');

const [, , minPath, outPath, publicMinPath, publicOutPath] = process.argv;

for (const [srcPath, dstPath] of [[minPath, outPath], [publicMinPath, publicOutPath]]) {
  let body = fs.readFileSync(srcPath, 'utf8').trim();
  if (!body.startsWith('javascript:')) body = `javascript:${body}`;
  fs.writeFileSync(dstPath, `${body}\n`);
  console.log(`Generated ${dstPath} (${body.length} chars)`);
}
NODE

echo "Generated ${MIN_OUT}"
echo "Generated ${PUBLIC_MIN_OUT}"
