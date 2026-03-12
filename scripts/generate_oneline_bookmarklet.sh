#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
SRC="${ROOT_DIR}/src/ai-chat-export.js"
MIN_OUT="${ROOT_DIR}/dist/ai-chat-export.min.js"
OUT="${ROOT_DIR}/dist/ai-chat-export.oneliner.js"
BOOKMARKLET_OUT="${ROOT_DIR}/ai-chat-export.bookmarklet.oneliner.js"
PUBLIC_MIN_OUT="${ROOT_DIR}/dist/ai-chat-export.public.min.js"
PUBLIC_OUT="${ROOT_DIR}/ai-chat-export.public.oneliner.js"
LITE_PUBLIC_MIN_OUT="${ROOT_DIR}/dist/ai-chat-export.public.no-obs.min.js"
LITE_PUBLIC_OUT="${ROOT_DIR}/variants/ai-chat-export.public.no-obs.oneliner.js"
LITE_PUBLIC_ENCODED_OUT="${ROOT_DIR}/variants/ai-chat-export.public.no-obs.encoded.oneliner.js"
MINIMAL_PUBLIC_MIN_OUT="${ROOT_DIR}/dist/ai-chat-export.public.minimal.min.js"
MINIMAL_PUBLIC_OUT="${ROOT_DIR}/variants/ai-chat-export.public.minimal.oneliner.js"
export BUN_TMPDIR="${BUN_TMPDIR:-${TMPDIR:-/tmp}}"
export BUN_INSTALL="${BUN_INSTALL:-${BUN_TMPDIR%/}/bun-install}"
TMP_BODY="$(mktemp "${TMPDIR:-/tmp}/ai-chat-export.body.XXXXXX.js")"
TMP_MIN="$(mktemp "${TMPDIR:-/tmp}/ai-chat-export.min.XXXXXX.js")"
TMP_PUBLIC_MIN="$(mktemp "${TMPDIR:-/tmp}/ai-chat-export.public.min.XXXXXX.js")"
TMP_LITE_BODY="$(mktemp "${TMPDIR:-/tmp}/ai-chat-export.no-obs.body.XXXXXX.js")"
TMP_LITE_PUBLIC_MIN="$(mktemp "${TMPDIR:-/tmp}/ai-chat-export.no-obs.public.min.XXXXXX.js")"
TMP_MINIMAL_BODY="$(mktemp "${TMPDIR:-/tmp}/ai-chat-export.minimal.body.XXXXXX.js")"
TMP_MINIMAL_PUBLIC_MIN="$(mktemp "${TMPDIR:-/tmp}/ai-chat-export.minimal.public.min.XXXXXX.js")"

cleanup() {
  rm -f "${TMP_BODY}" "${TMP_MIN}" "${TMP_PUBLIC_MIN}" "${TMP_LITE_BODY}" "${TMP_LITE_PUBLIC_MIN}" "${TMP_MINIMAL_BODY}" "${TMP_MINIMAL_PUBLIC_MIN}"
}
trap cleanup EXIT

mkdir -p "${ROOT_DIR}/variants"

node - "${SRC}" "${TMP_BODY}" "${TMP_LITE_BODY}" "${TMP_MINIMAL_BODY}" <<'NODE'
const fs = require('fs');

const [, , srcPath, bodyPath, liteBodyPath, minimalBodyPath] = process.argv;
const source = fs.readFileSync(srcPath, 'utf8').replace(/^javascript:/, '');

function replaceExact(text, from, to, label) {
  if (!text.includes(from)) throw new Error(`Missing ${label}`);
  return text.replace(from, to);
}

function replaceRegex(text, pattern, replacement, label) {
  if (!pattern.test(text)) throw new Error(`Missing ${label}`);
  return text.replace(pattern, replacement);
}

function removeBetween(text, startMarker, endMarker, label) {
  const start = text.indexOf(startMarker);
  if (start === -1) throw new Error(`Missing ${label} start`);
  const end = text.indexOf(endMarker, start);
  if (end === -1) throw new Error(`Missing ${label} end`);
  return text.slice(0, start) + text.slice(end);
}

const lite = replaceExact(
  source,
  'const ENABLE_OBSIDIAN_FORMAT = true;',
  'const ENABLE_OBSIDIAN_FORMAT = false;',
  'ENABLE_OBSIDIAN_FORMAT flag',
);

let minimal = lite;
minimal = replaceRegex(
  minimal,
  /\n\s*json: Object\.freeze\(\{\n\s*label:'JSON',\n\s*hint:'機械処理向け',\n\s*ext:'json',\n\s*mime:'application\/json;charset=utf-8'\n\s*\}\)/,
  '',
  'JSON format definition',
);
minimal = replaceExact(
  minimal,
  "const FORMAT_ORDER = ENABLE_OBSIDIAN_FORMAT ? ['std', 'txt', 'obs', 'json'] : ['std', 'txt', 'json'];",
  "const FORMAT_ORDER = ENABLE_OBSIDIAN_FORMAT ? ['std', 'txt', 'obs'] : ['std', 'txt'];",
  'FORMAT_ORDER',
);
minimal = removeBetween(
  minimal,
  "  buildQualityDetailText(quality){",
  "  formatOutput(messages, quality, diff){",
  'quality and preview helpers',
);
minimal = removeBetween(
  minimal,
  "    if (formatId==='json'){\n",
  "\n\n    let out = '';",
  'JSON output branch',
);
minimal = removeBetween(
  minimal,
  "      const previewData = this.buildOutputPreviewText(output);\n\n",
  "      // 保存予定ファイル名\n",
  'preview and detail dialog blocks',
);
minimal = removeBetween(
  minimal,
  "      // 手動コピー欄\n",
  "      const footer = Utils.el('div',{style:`",
  'manual copy dialog block',
);
minimal = replaceExact(
  minimal,
  `          }catch{
            Utils.toast('コピーできなかったため、ファイル保存に切り替えます。','warn', 3200);
            const ok = this.downloadFile(currentFileName, output);
            if (ok){
              await finalizeWithState({action:'done_file', saveState:'file'}, 'ファイル保存済み');
            }else{
              setSaveState('コピー/保存に失敗');
              Utils.toast('保存に失敗しました。', 'error', 2200);
              finish({action:'done_fail', saveState:'failed'});
            }
          }`,
  `          }catch{
            try{
              window.prompt('コピーできなかったため、この欄から手動でコピーしてください。', output);
            }catch{
              Utils.toast('コピーできませんでした。保存（ファイル）を使ってください。','warn', 3200);
            }
          }`,
  'minimal clipboard prompt fallback',
);

fs.writeFileSync(bodyPath, `${source}\n`);
fs.writeFileSync(liteBodyPath, `${lite}\n`);
fs.writeFileSync(minimalBodyPath, `${minimal}\n`);
NODE

if command -v bunx >/dev/null 2>&1; then
  bunx terser "${TMP_BODY}" --compress --mangle --format ascii_only=true --output "${TMP_MIN}"
  bunx terser "${TMP_BODY}" --compress 'passes=3,toplevel=true' --mangle 'toplevel=true' --format ascii_only=true --output "${TMP_PUBLIC_MIN}"
  bunx terser "${TMP_LITE_BODY}" --compress 'passes=3,toplevel=true' --mangle 'toplevel=true' --format ascii_only=true --output "${TMP_LITE_PUBLIC_MIN}"
  bunx terser "${TMP_MINIMAL_BODY}" --compress 'passes=3,toplevel=true' --mangle 'toplevel=true' --format ascii_only=true --output "${TMP_MINIMAL_PUBLIC_MIN}"
else
  npx --yes terser "${TMP_BODY}" --compress --mangle --format ascii_only=true --output "${TMP_MIN}"
  npx --yes terser "${TMP_BODY}" --compress 'passes=3,toplevel=true' --mangle 'toplevel=true' --format ascii_only=true --output "${TMP_PUBLIC_MIN}"
  npx --yes terser "${TMP_LITE_BODY}" --compress 'passes=3,toplevel=true' --mangle 'toplevel=true' --format ascii_only=true --output "${TMP_LITE_PUBLIC_MIN}"
  npx --yes terser "${TMP_MINIMAL_BODY}" --compress 'passes=3,toplevel=true' --mangle 'toplevel=true' --format ascii_only=true --output "${TMP_MINIMAL_PUBLIC_MIN}"
fi
cp "${TMP_MIN}" "${MIN_OUT}"
cp "${TMP_PUBLIC_MIN}" "${PUBLIC_MIN_OUT}"
cp "${TMP_LITE_PUBLIC_MIN}" "${LITE_PUBLIC_MIN_OUT}"
cp "${TMP_MINIMAL_PUBLIC_MIN}" "${MINIMAL_PUBLIC_MIN_OUT}"

node - "${TMP_MIN}" "${OUT}" "${TMP_PUBLIC_MIN}" "${PUBLIC_OUT}" "${TMP_LITE_PUBLIC_MIN}" "${LITE_PUBLIC_OUT}" "${LITE_PUBLIC_ENCODED_OUT}" "${TMP_MINIMAL_PUBLIC_MIN}" "${MINIMAL_PUBLIC_OUT}" "${BOOKMARKLET_OUT}" <<'NODE'
const fs = require('fs');

const [, , minPath, outPath, publicMinPath, publicOutPath, litePublicMinPath, litePublicOutPath, litePublicEncodedOutPath, minimalPublicMinPath, minimalPublicOutPath, bookmarkletOutPath] = process.argv;

for (const [srcPath, dstPath] of [[minPath, outPath], [publicMinPath, publicOutPath], [litePublicMinPath, litePublicOutPath], [minimalPublicMinPath, minimalPublicOutPath], [minimalPublicMinPath, bookmarkletOutPath]]) {
  let body = fs.readFileSync(srcPath, 'utf8').trim();
  if (!body.startsWith('javascript:')) body = `javascript:${body}`;
  fs.writeFileSync(dstPath, `${body}\n`);
  console.log(`Generated ${dstPath} (${body.length} chars)`);
}

let encodedBody = fs.readFileSync(litePublicMinPath, 'utf8').trim();
if (!encodedBody.startsWith('javascript:')) encodedBody = `javascript:${encodedBody}`;
encodedBody = encodeURI(encodedBody);
fs.writeFileSync(litePublicEncodedOutPath, `${encodedBody}\n`);
console.log(`Generated ${litePublicEncodedOutPath} (${encodedBody.length} chars)`);
NODE

echo "Generated ${MIN_OUT}"
echo "Generated ${PUBLIC_MIN_OUT}"
echo "Generated ${LITE_PUBLIC_MIN_OUT}"
echo "Generated ${LITE_PUBLIC_ENCODED_OUT}"
echo "Generated ${MINIMAL_PUBLIC_MIN_OUT}"
echo "Generated ${BOOKMARKLET_OUT}"
