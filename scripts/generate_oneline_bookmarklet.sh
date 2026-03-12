#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
SRC="${ROOT_DIR}/src/ai-chat-export.js"
ARCHIVE_DIR="${ROOT_DIR}/archive"
ARCHIVE_DIST_DIR="${ROOT_DIR}/archive/dist"
ARCHIVE_BOOKMARKLET_DIR="${ROOT_DIR}/archive/bookmarklets"
ARCHIVE_VARIANTS_DIR="${ROOT_DIR}/archive/variants"
ARCHIVE_LOADERS_DIR="${ROOT_DIR}/archive/loaders"
MIN_OUT="${ARCHIVE_DIST_DIR}/ai-chat-export.min.js"
OUT="${ARCHIVE_DIST_DIR}/ai-chat-export.oneliner.js"
CHROME_BOOKMARKLET_OUT="${ROOT_DIR}/ai-chat-export.chrome.bookmarklet.oneliner.js"
FIREFOX_BOOKMARKLET_OUT="${ROOT_DIR}/ai-chat-export.firefox.bookmarklet.oneliner.js"
PUBLIC_MIN_OUT="${ARCHIVE_DIST_DIR}/ai-chat-export.public.min.js"
PUBLIC_OUT="${ARCHIVE_BOOKMARKLET_DIR}/ai-chat-export.public.oneliner.js"
LITE_PUBLIC_MIN_OUT="${ARCHIVE_DIST_DIR}/ai-chat-export.public.no-obs.min.js"
LITE_PUBLIC_OUT="${ARCHIVE_VARIANTS_DIR}/ai-chat-export.public.no-obs.oneliner.js"
LITE_PUBLIC_ENCODED_OUT="${ARCHIVE_VARIANTS_DIR}/ai-chat-export.public.no-obs.encoded.oneliner.js"
MINIMAL_PUBLIC_MIN_OUT="${ARCHIVE_DIST_DIR}/ai-chat-export.public.minimal.min.js"
MINIMAL_PUBLIC_OUT="${ARCHIVE_VARIANTS_DIR}/ai-chat-export.public.minimal.oneliner.js"
UNIFIED_FIREFOX_PUBLIC_MIN_OUT="${ARCHIVE_DIST_DIR}/ai-chat-export.unified.firefox.minimal.min.js"
UNIFIED_FIREFOX_PUBLIC_OUT="${ARCHIVE_VARIANTS_DIR}/ai-chat-export.unified.firefox.minimal.oneliner.js"
CHATGPT_CLAUDE_MINIMAL_PUBLIC_MIN_OUT="${ARCHIVE_DIST_DIR}/ai-chat-export.chatgpt-claude.minimal.min.js"
CHATGPT_CLAUDE_MINIMAL_PUBLIC_OUT="${ARCHIVE_VARIANTS_DIR}/ai-chat-export.chatgpt-claude.minimal.oneliner.js"
AISTUDIO_GROK_MINIMAL_PUBLIC_MIN_OUT="${ARCHIVE_DIST_DIR}/ai-chat-export.aistudio-grok.minimal.min.js"
AISTUDIO_GROK_MINIMAL_PUBLIC_OUT="${ARCHIVE_VARIANTS_DIR}/ai-chat-export.aistudio-grok.minimal.oneliner.js"
CLAUDE_MINIMAL_PUBLIC_MIN_OUT="${ARCHIVE_DIST_DIR}/ai-chat-export.claude.minimal.min.js"
CLAUDE_MINIMAL_PUBLIC_OUT="${ARCHIVE_VARIANTS_DIR}/ai-chat-export.claude.minimal.oneliner.js"
export BUN_TMPDIR="${BUN_TMPDIR:-${TMPDIR:-/tmp}}"
export BUN_INSTALL="${BUN_INSTALL:-${BUN_TMPDIR%/}/bun-install}"
TMP_BODY="$(mktemp "${TMPDIR:-/tmp}/ai-chat-export.body.XXXXXX.js")"
TMP_MIN="$(mktemp "${TMPDIR:-/tmp}/ai-chat-export.min.XXXXXX.js")"
TMP_PUBLIC_MIN="$(mktemp "${TMPDIR:-/tmp}/ai-chat-export.public.min.XXXXXX.js")"
TMP_LITE_BODY="$(mktemp "${TMPDIR:-/tmp}/ai-chat-export.no-obs.body.XXXXXX.js")"
TMP_LITE_PUBLIC_MIN="$(mktemp "${TMPDIR:-/tmp}/ai-chat-export.no-obs.public.min.XXXXXX.js")"
TMP_MINIMAL_BODY="$(mktemp "${TMPDIR:-/tmp}/ai-chat-export.minimal.body.XXXXXX.js")"
TMP_MINIMAL_PUBLIC_MIN="$(mktemp "${TMPDIR:-/tmp}/ai-chat-export.minimal.public.min.XXXXXX.js")"
TMP_UNIFIED_FIREFOX_BODY="$(mktemp "${TMPDIR:-/tmp}/ai-chat-export.unified.firefox.body.XXXXXX.js")"
TMP_UNIFIED_FIREFOX_PUBLIC_MIN="$(mktemp "${TMPDIR:-/tmp}/ai-chat-export.unified.firefox.public.min.XXXXXX.js")"
TMP_CHATGPT_CLAUDE_MINIMAL_BODY="$(mktemp "${TMPDIR:-/tmp}/ai-chat-export.chatgpt-claude-minimal.body.XXXXXX.js")"
TMP_CHATGPT_CLAUDE_MINIMAL_PUBLIC_MIN="$(mktemp "${TMPDIR:-/tmp}/ai-chat-export.chatgpt-claude-minimal.public.min.XXXXXX.js")"
TMP_AISTUDIO_GROK_MINIMAL_BODY="$(mktemp "${TMPDIR:-/tmp}/ai-chat-export.aistudio-grok-minimal.body.XXXXXX.js")"
TMP_AISTUDIO_GROK_MINIMAL_PUBLIC_MIN="$(mktemp "${TMPDIR:-/tmp}/ai-chat-export.aistudio-grok-minimal.public.min.XXXXXX.js")"
TMP_CLAUDE_MINIMAL_BODY="$(mktemp "${TMPDIR:-/tmp}/ai-chat-export.claude-minimal.body.XXXXXX.js")"
TMP_CLAUDE_MINIMAL_PUBLIC_MIN="$(mktemp "${TMPDIR:-/tmp}/ai-chat-export.claude-minimal.public.min.XXXXXX.js")"

cleanup() {
  rm -f "${TMP_BODY}" "${TMP_MIN}" "${TMP_PUBLIC_MIN}" "${TMP_LITE_BODY}" "${TMP_LITE_PUBLIC_MIN}" "${TMP_MINIMAL_BODY}" "${TMP_MINIMAL_PUBLIC_MIN}" "${TMP_UNIFIED_FIREFOX_BODY}" "${TMP_UNIFIED_FIREFOX_PUBLIC_MIN}" "${TMP_CHATGPT_CLAUDE_MINIMAL_BODY}" "${TMP_CHATGPT_CLAUDE_MINIMAL_PUBLIC_MIN}" "${TMP_AISTUDIO_GROK_MINIMAL_BODY}" "${TMP_AISTUDIO_GROK_MINIMAL_PUBLIC_MIN}" "${TMP_CLAUDE_MINIMAL_BODY}" "${TMP_CLAUDE_MINIMAL_PUBLIC_MIN}"
}
trap cleanup EXIT

mkdir -p "${ARCHIVE_DIST_DIR}" "${ARCHIVE_BOOKMARKLET_DIR}" "${ARCHIVE_VARIANTS_DIR}" "${ARCHIVE_LOADERS_DIR}"

node - "${SRC}" "${TMP_BODY}" "${TMP_LITE_BODY}" "${TMP_MINIMAL_BODY}" "${TMP_UNIFIED_FIREFOX_BODY}" "${TMP_CHATGPT_CLAUDE_MINIMAL_BODY}" "${TMP_AISTUDIO_GROK_MINIMAL_BODY}" "${TMP_CLAUDE_MINIMAL_BODY}" <<'NODE'
const fs = require('fs');

const [, , srcPath, bodyPath, liteBodyPath, minimalBodyPath, unifiedFirefoxBodyPath, chatgptClaudeMinimalBodyPath, aiStudioGrokMinimalBodyPath, claudeMinimalBodyPath] = process.argv;
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
  "  formatOutput(messages, quality, diff, preset=this.config.preset){",
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

const chatgptClaudeMinimal = replaceExact(
  minimal,
  "const adapters = [new ChatGPTAdapter(), new ClaudeAdapter(), new AIStudioAdapter(), new GrokAdapter(), new BaseAdapter()];",
  "const adapters = [new ChatGPTAdapter(), new ClaudeAdapter(), new BaseAdapter()];",
  'ChatGPT+Claude adapter factory',
);

const aiStudioGrokMinimal = replaceExact(
  minimal,
  "const adapters = [new ChatGPTAdapter(), new ClaudeAdapter(), new AIStudioAdapter(), new GrokAdapter(), new BaseAdapter()];",
  "const adapters = [new AIStudioAdapter(), new GrokAdapter(), new BaseAdapter()];",
  'AIStudio+Grok adapter factory',
);

const claudeMinimal = replaceExact(
  minimal,
  "const adapters = [new ChatGPTAdapter(), new ClaudeAdapter(), new AIStudioAdapter(), new GrokAdapter(), new BaseAdapter()];",
  "const adapters = [new ClaudeAdapter(), new BaseAdapter()];",
  'Claude-only adapter factory',
);

let unifiedFirefox = minimal;
unifiedFirefox = replaceRegex(
  unifiedFirefox,
  /\n\s*buildResultSnapshotSummaryLines\(snapshot\)\{[\s\S]*?\n\s*async resolveResultDialogChoice\(/,
  `
  buildResultSnapshotSummaryLines(snapshot){
    if (!snapshot) return [];
    return [\`会話数: \${(snapshot.messages || []).length}件\`];
  }

  async resolveResultDialogChoice(`,
  'result snapshot summary block',
);
unifiedFirefox = replaceRegex(
  unifiedFirefox,
  /\n\s*qualitySummary\(quality, diff\)\{[\s\S]*?\n\s*getPresetLabel\(\)\{/,
  `
  qualitySummary(quality,diff){
    const q = quality || {status:'WARN', score:0};
    const label = q.status==='PASS' ? '良好' : q.status==='WARN' ? '注意' : '再実行';
    const color = q.status==='PASS' ? THEME.ok : q.status==='WARN' ? THEME.warn : THEME.bad;
    const hint = q.status==='PASS' ? '保存してよさそうです。' : q.status==='WARN' ? '必要なら再実行してください。' : '再実行推奨です。';
    let diffLine = '';
    if (diff?.previous){
      const sign = diff.diff>0 ? '+' : '';
      diffLine = \`\${diff.previousLabel || '前回'}: \${diff.previous.count}件 / 今回: \${diff.now.count}件（差分 \${sign}\${diff.diff}件）\`;
    }
    return {label, color, hint, diffLine, score:q.score, raw:q};
  }

  getPresetLabel(){`,
  'unified Firefox quality summary block',
);
unifiedFirefox = replaceRegex(
  unifiedFirefox,
  /\n\s*buildExportMetadata\(title, messages, quality, diff, preset=this\.config\.preset\)\{[\s\S]*?\n\s*formatOutput\(messages, quality, diff, preset=this\.config\.preset\)\{/,
  `
  buildExportMetadata(title, messages, quality, diff, preset=this.config.preset){
    return {
      title,
      site: this.adapter.label,
      conversation_url: location.href,
      saved_at: Utils.formatDateJST(new Date()),
      message_count: messages.length,
      preset,
      format: this.getFormatId(),
      quality_status: quality?.status || 'WARN',
      quality_score: quality?.score ?? 0,
      previous_count: diff?.previous?.count
    };
  }

  dumpYaml(obj){
    return ['---', ...Object.entries(obj).map(([k,v])=>\`\${k}: \${this.yamlValue(v)}\`), '---', ''].join('\\n');
  }

  warningSummary({quality, diff}){
    const q = quality || {status:'WARN'};
    const parts = [];
    if (q.status!=='PASS') parts.push(q.status==='WARN' ? '注意' : '再実行');
    if (diff?.previous){
      const diffAbs = Math.abs(diff.diff || 0);
      if (diffAbs > 1) parts.push(\`差分 \${diff.diff>0?'+':''}\${diff.diff}件\`);
    }
    const text = parts.length ? parts.join(' / ') : 'なし';
    return {hasWarning: parts.length > 0, text};
  }

  compactSummaryLines(messages, quality, diff, savedState='未保存'){
    const diffLine = diff?.previous ? \`前回比: \${diff.diff>0?'+':''}\${diff.diff}件\` : '前回比: なし';
    return [\`抽出件数: \${messages.length}件\`, \`保存状態: \${savedState}\`, diffLine];
  }

  lastAttemptStatusLabel(){
    const {previous} = this.loadRunMeta();
    return \`最終保存: \${Number.isFinite(previous?.count) ? \`\${previous.count}件\` : 'なし'}\`;
  }

  comparisonBaseLabel(diff){
    return Number.isFinite(diff?.previous?.count) ? \`比較ベース: \${diff.previous.count}件\` : '比較ベース: なし';
  }

  async confirmRerunDialog(mode='normal'){
    const label = mode==='careful' ? 'ていねいに再実行' : '再実行';
    return window.confirm(\`\${label}しますか？\\n現在の結果は保持したまま再取得します。\`);
  }

  makeFileName(title){
    const base = Utils.filenameSafe(title);
    const d = new Date();
    const pad=n=>String(n).padStart(2,'0');
    const stamp = \`\${d.getFullYear()}-\${pad(d.getMonth()+1)}-\${pad(d.getDate())}_\${pad(d.getHours())}\${pad(d.getMinutes())}\`;
    return \`\${stamp}_\${base}.\${this.getFormatDef().ext}\`;
  }

  formatOutput(messages, quality, diff, preset=this.config.preset){`,
  'unified Firefox compact export/output helpers',
);
unifiedFirefox = replaceRegex(
  unifiedFirefox,
  /\n\s*async showResultDialog\(messages, quality, options=\{\}\)\{[\s\S]*?\n\s*async runOnce\(\{skipConfig=false, presetOverride=null\}=\{\}\)\{/,
  `
  async showResultDialog(messages, quality, options={}){
    return new Promise(resolve=>{
      const alternateSnapshot = options?.alternateSnapshot || null;
      const alternateButtonLabel = options?.alternateButtonLabel || '前回結果';
      const resultPreset = options?.preset || this.config.preset;
      const diff = this.diffInfo(messages, alternateSnapshot);
      const summary = this.qualitySummary(quality, diff);
      const {fileName, output} = this.formatOutput(messages, quality, diff, resultPreset);

      const ov = this.overlay();
      const modal = Utils.el('div',{style:\`width:min(520px, calc(100vw - 24px));background:\${THEME.surface};border:1px solid \${THEME.border};border-radius:16px;overflow:hidden;box-shadow:0 10px 28px rgba(0,0,0,.4);color:\${THEME.fg};\`});
      const body = Utils.el('div',{style:\`padding:18px;display:grid;gap:10px;background:\${THEME.bg};\`});
      const lines = [
        \`判定: \${summary.label}（\${summary.score}点）\`,
        summary.hint,
        summary.diffLine || this.comparisonBaseLabel(diff),
        \`件数: \${messages.length}件 / 速度: \${this.getPresetLabelFor(resultPreset)} / 形式: \${this.getFormatLabel()}\`
      ];
      for (const line of lines){
        body.appendChild(Utils.el('div',{text:line,style:\`font-size:14px;line-height:1.6;color:\${THEME.fg};font-weight:500;\`}));
      }

      const footer = Utils.el('div',{style:\`padding:14px 18px;background:\${THEME.surface};border-top:1px solid \${THEME.border};display:flex;gap:10px;justify-content:flex-end;flex-wrap:wrap;\`});
      const finish=(action)=>{
        try{ ov.remove(); }catch{}
        resolve(action);
      };

      const footerButtons = [
        this.btn('中止','subtle', ()=>finish({action:'cancel'})),
        alternateSnapshot ? this.btn(alternateButtonLabel,'secondary', ()=>finish({action:'show_alternate_result'})) : null,
        this.btn('ていねいに再実行','secondary', async ()=>{
          if (await this.confirmRerunDialog('careful')) finish({action:'rerun_careful'});
        }),
        this.btn('コピー','secondary', async ()=>{
          try{
            await navigator.clipboard.writeText(output);
            Utils.toast('コピーしました。','success');
            finish({action:'done_clipboard', saveState:'clipboard'});
          }catch{
            try{
              window.prompt('コピーできなかったため、この欄から手動でコピーしてください。', output);
            }catch{
              Utils.toast('コピーできませんでした。保存を使ってください。','warn', 3200);
            }
          }
        }),
        this.btn('保存','primary', ()=>{
          const ok = this.downloadFile(fileName, output);
          finish(ok ? {action:'done_file', saveState:'file'} : {action:'done_fail', saveState:'failed'});
        })
      ].filter(Boolean);

      footer.append(...footerButtons);

      modal.append(body, footer);
      ov.appendChild(modal);
      document.body.appendChild(ov);
    });
  }

  async runOnce({skipConfig=false, presetOverride=null}={}){`,
  'unified Firefox compact result dialog',
);

fs.writeFileSync(bodyPath, `${source}\n`);
fs.writeFileSync(liteBodyPath, `${lite}\n`);
fs.writeFileSync(minimalBodyPath, `${minimal}\n`);
fs.writeFileSync(unifiedFirefoxBodyPath, `${unifiedFirefox}\n`);
fs.writeFileSync(chatgptClaudeMinimalBodyPath, `${chatgptClaudeMinimal}\n`);
fs.writeFileSync(aiStudioGrokMinimalBodyPath, `${aiStudioGrokMinimal}\n`);
fs.writeFileSync(claudeMinimalBodyPath, `${claudeMinimal}\n`);
NODE

if command -v bunx >/dev/null 2>&1; then
  bunx terser "${TMP_BODY}" --compress --mangle --format ascii_only=true --output "${TMP_MIN}"
  bunx terser "${TMP_BODY}" --compress 'passes=3,toplevel=true' --mangle 'toplevel=true' --format ascii_only=true --output "${TMP_PUBLIC_MIN}"
  bunx terser "${TMP_LITE_BODY}" --compress 'passes=3,toplevel=true' --mangle 'toplevel=true' --format ascii_only=true --output "${TMP_LITE_PUBLIC_MIN}"
  bunx terser "${TMP_MINIMAL_BODY}" --compress 'passes=3,toplevel=true' --mangle 'toplevel=true' --format ascii_only=true --output "${TMP_MINIMAL_PUBLIC_MIN}"
  bunx terser "${TMP_UNIFIED_FIREFOX_BODY}" --compress 'passes=3,toplevel=true' --mangle 'toplevel=true' --format ascii_only=true --output "${TMP_UNIFIED_FIREFOX_PUBLIC_MIN}"
  bunx terser "${TMP_CHATGPT_CLAUDE_MINIMAL_BODY}" --compress 'passes=3,toplevel=true' --mangle 'toplevel=true' --format ascii_only=true --output "${TMP_CHATGPT_CLAUDE_MINIMAL_PUBLIC_MIN}"
  bunx terser "${TMP_AISTUDIO_GROK_MINIMAL_BODY}" --compress 'passes=3,toplevel=true' --mangle 'toplevel=true' --format ascii_only=true --output "${TMP_AISTUDIO_GROK_MINIMAL_PUBLIC_MIN}"
  bunx terser "${TMP_CLAUDE_MINIMAL_BODY}" --compress 'passes=3,toplevel=true' --mangle 'toplevel=true' --format ascii_only=true --output "${TMP_CLAUDE_MINIMAL_PUBLIC_MIN}"
else
  npx --yes terser "${TMP_BODY}" --compress --mangle --format ascii_only=true --output "${TMP_MIN}"
  npx --yes terser "${TMP_BODY}" --compress 'passes=3,toplevel=true' --mangle 'toplevel=true' --format ascii_only=true --output "${TMP_PUBLIC_MIN}"
  npx --yes terser "${TMP_LITE_BODY}" --compress 'passes=3,toplevel=true' --mangle 'toplevel=true' --format ascii_only=true --output "${TMP_LITE_PUBLIC_MIN}"
  npx --yes terser "${TMP_MINIMAL_BODY}" --compress 'passes=3,toplevel=true' --mangle 'toplevel=true' --format ascii_only=true --output "${TMP_MINIMAL_PUBLIC_MIN}"
  npx --yes terser "${TMP_UNIFIED_FIREFOX_BODY}" --compress 'passes=3,toplevel=true' --mangle 'toplevel=true' --format ascii_only=true --output "${TMP_UNIFIED_FIREFOX_PUBLIC_MIN}"
  npx --yes terser "${TMP_CHATGPT_CLAUDE_MINIMAL_BODY}" --compress 'passes=3,toplevel=true' --mangle 'toplevel=true' --format ascii_only=true --output "${TMP_CHATGPT_CLAUDE_MINIMAL_PUBLIC_MIN}"
  npx --yes terser "${TMP_AISTUDIO_GROK_MINIMAL_BODY}" --compress 'passes=3,toplevel=true' --mangle 'toplevel=true' --format ascii_only=true --output "${TMP_AISTUDIO_GROK_MINIMAL_PUBLIC_MIN}"
  npx --yes terser "${TMP_CLAUDE_MINIMAL_BODY}" --compress 'passes=3,toplevel=true' --mangle 'toplevel=true' --format ascii_only=true --output "${TMP_CLAUDE_MINIMAL_PUBLIC_MIN}"
fi
cp "${TMP_MIN}" "${MIN_OUT}"
cp "${TMP_PUBLIC_MIN}" "${PUBLIC_MIN_OUT}"
cp "${TMP_LITE_PUBLIC_MIN}" "${LITE_PUBLIC_MIN_OUT}"
cp "${TMP_MINIMAL_PUBLIC_MIN}" "${MINIMAL_PUBLIC_MIN_OUT}"
cp "${TMP_UNIFIED_FIREFOX_PUBLIC_MIN}" "${UNIFIED_FIREFOX_PUBLIC_MIN_OUT}"
cp "${TMP_CHATGPT_CLAUDE_MINIMAL_PUBLIC_MIN}" "${CHATGPT_CLAUDE_MINIMAL_PUBLIC_MIN_OUT}"
cp "${TMP_AISTUDIO_GROK_MINIMAL_PUBLIC_MIN}" "${AISTUDIO_GROK_MINIMAL_PUBLIC_MIN_OUT}"
cp "${TMP_CLAUDE_MINIMAL_PUBLIC_MIN}" "${CLAUDE_MINIMAL_PUBLIC_MIN_OUT}"

node - "${TMP_MIN}" "${OUT}" "${TMP_PUBLIC_MIN}" "${PUBLIC_OUT}" "${TMP_LITE_PUBLIC_MIN}" "${LITE_PUBLIC_OUT}" "${LITE_PUBLIC_ENCODED_OUT}" "${TMP_MINIMAL_PUBLIC_MIN}" "${MINIMAL_PUBLIC_OUT}" "${CHROME_BOOKMARKLET_OUT}" "${TMP_UNIFIED_FIREFOX_PUBLIC_MIN}" "${UNIFIED_FIREFOX_PUBLIC_OUT}" "${FIREFOX_BOOKMARKLET_OUT}" "${TMP_CHATGPT_CLAUDE_MINIMAL_PUBLIC_MIN}" "${CHATGPT_CLAUDE_MINIMAL_PUBLIC_OUT}" "${TMP_AISTUDIO_GROK_MINIMAL_PUBLIC_MIN}" "${AISTUDIO_GROK_MINIMAL_PUBLIC_OUT}" "${TMP_CLAUDE_MINIMAL_PUBLIC_MIN}" "${CLAUDE_MINIMAL_PUBLIC_OUT}" <<'NODE'
const fs = require('fs');

const [, , minPath, outPath, publicMinPath, publicOutPath, litePublicMinPath, litePublicOutPath, litePublicEncodedOutPath, minimalPublicMinPath, minimalPublicOutPath, chromeBookmarkletOutPath, unifiedFirefoxPublicMinPath, unifiedFirefoxPublicOutPath, firefoxBookmarkletOutPath, chatgptClaudeMinimalPublicMinPath, chatgptClaudeMinimalPublicOutPath, aiStudioGrokMinimalPublicMinPath, aiStudioGrokMinimalPublicOutPath, claudeMinimalPublicMinPath, claudeMinimalPublicOutPath] = process.argv;

for (const [srcPath, dstPath] of [[minPath, outPath], [publicMinPath, publicOutPath], [litePublicMinPath, litePublicOutPath], [minimalPublicMinPath, minimalPublicOutPath], [minimalPublicMinPath, chromeBookmarkletOutPath], [unifiedFirefoxPublicMinPath, unifiedFirefoxPublicOutPath], [unifiedFirefoxPublicMinPath, firefoxBookmarkletOutPath], [chatgptClaudeMinimalPublicMinPath, chatgptClaudeMinimalPublicOutPath], [aiStudioGrokMinimalPublicMinPath, aiStudioGrokMinimalPublicOutPath], [claudeMinimalPublicMinPath, claudeMinimalPublicOutPath]]) {
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
echo "Generated ${UNIFIED_FIREFOX_PUBLIC_MIN_OUT}"
echo "Generated ${CHATGPT_CLAUDE_MINIMAL_PUBLIC_MIN_OUT}"
echo "Generated ${AISTUDIO_GROK_MINIMAL_PUBLIC_MIN_OUT}"
echo "Generated ${CLAUDE_MINIMAL_PUBLIC_MIN_OUT}"
echo "Generated ${CHROME_BOOKMARKLET_OUT}"
echo "Generated ${UNIFIED_FIREFOX_PUBLIC_OUT}"
echo "Generated ${FIREFOX_BOOKMARKLET_OUT}"
rm -f \
  "${ROOT_DIR}/ai-chat-export.bookmarklet.oneliner.js" \
  "${ROOT_DIR}/ai-chat-export.unified.bookmarklet.oneliner.js" \
  "${ROOT_DIR}/ai-chat-export.chatgpt-claude.bookmarklet.oneliner.js" \
  "${ROOT_DIR}/ai-chat-export.aistudio-grok.bookmarklet.oneliner.js" \
  "${ROOT_DIR}/ai-chat-export.claude.bookmarklet.oneliner.js"
