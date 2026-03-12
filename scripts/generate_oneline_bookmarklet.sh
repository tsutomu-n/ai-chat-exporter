#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
SRC="${ROOT_DIR}/src/ai-chat-export.js"
CHROME_BOOKMARKLET_OUT="${ROOT_DIR}/ai-chat-export.chrome.bookmarklet.oneliner.js"
FIREFOX_BOOKMARKLET_OUT="${ROOT_DIR}/ai-chat-export.firefox.bookmarklet.oneliner.js"
DOCS_CHROME_BOOKMARKLET_OUT="${ROOT_DIR}/docs/ai-chat-export.chrome.bookmarklet.oneliner.js"
DOCS_FIREFOX_BOOKMARKLET_OUT="${ROOT_DIR}/docs/ai-chat-export.firefox.bookmarklet.oneliner.js"

export BUN_TMPDIR="${BUN_TMPDIR:-${TMPDIR:-/tmp}}"
export BUN_INSTALL="${BUN_INSTALL:-${BUN_TMPDIR%/}/bun-install}"

TMP_MINIMAL_BODY="$(mktemp "${TMPDIR:-/tmp}/ai-chat-export.minimal.body.XXXXXX.js")"
TMP_UNIFIED_FIREFOX_BODY="$(mktemp "${TMPDIR:-/tmp}/ai-chat-export.unified.firefox.body.XXXXXX.js")"
TMP_CHROME_MIN="$(mktemp "${TMPDIR:-/tmp}/ai-chat-export.chrome.min.XXXXXX.js")"
TMP_FIREFOX_MIN="$(mktemp "${TMPDIR:-/tmp}/ai-chat-export.firefox.min.XXXXXX.js")"

cleanup() {
  rm -f "${TMP_MINIMAL_BODY}" "${TMP_UNIFIED_FIREFOX_BODY}" "${TMP_CHROME_MIN}" "${TMP_FIREFOX_MIN}"
}
trap cleanup EXIT

mkdir -p "${ROOT_DIR}/docs"

node - "${SRC}" "${TMP_MINIMAL_BODY}" "${TMP_UNIFIED_FIREFOX_BODY}" <<'NODE'
const fs = require('fs');

const [, , srcPath, minimalBodyPath, unifiedFirefoxBodyPath] = process.argv;
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

fs.writeFileSync(minimalBodyPath, `${minimal}\n`);
fs.writeFileSync(unifiedFirefoxBodyPath, `${unifiedFirefox}\n`);
NODE

if command -v bunx >/dev/null 2>&1; then
  bunx terser "${TMP_MINIMAL_BODY}" --compress 'passes=3,toplevel=true' --mangle 'toplevel=true' --format ascii_only=true --output "${TMP_CHROME_MIN}"
  bunx terser "${TMP_UNIFIED_FIREFOX_BODY}" --compress 'passes=3,toplevel=true' --mangle 'toplevel=true' --format ascii_only=true --output "${TMP_FIREFOX_MIN}"
else
  npx --yes terser "${TMP_MINIMAL_BODY}" --compress 'passes=3,toplevel=true' --mangle 'toplevel=true' --format ascii_only=true --output "${TMP_CHROME_MIN}"
  npx --yes terser "${TMP_UNIFIED_FIREFOX_BODY}" --compress 'passes=3,toplevel=true' --mangle 'toplevel=true' --format ascii_only=true --output "${TMP_FIREFOX_MIN}"
fi

node - "${TMP_CHROME_MIN}" "${CHROME_BOOKMARKLET_OUT}" "${DOCS_CHROME_BOOKMARKLET_OUT}" "${TMP_FIREFOX_MIN}" "${FIREFOX_BOOKMARKLET_OUT}" "${DOCS_FIREFOX_BOOKMARKLET_OUT}" <<'NODE'
const fs = require('fs');

const [, , chromeMinPath, chromeOutPath, docsChromeOutPath, firefoxMinPath, firefoxOutPath, docsFirefoxOutPath] = process.argv;

for (const [srcPath, dstPath] of [
  [chromeMinPath, chromeOutPath],
  [chromeMinPath, docsChromeOutPath],
  [firefoxMinPath, firefoxOutPath],
  [firefoxMinPath, docsFirefoxOutPath],
]) {
  let body = fs.readFileSync(srcPath, 'utf8').trim();
  if (!body.startsWith('javascript:')) body = `javascript:${body}`;
  fs.writeFileSync(dstPath, `${body}\n`);
  console.log(`Generated ${dstPath} (${body.length} chars)`);
}
NODE

rm -f \
  "${ROOT_DIR}/ai-chat-export.bookmarklet.oneliner.js" \
  "${ROOT_DIR}/ai-chat-export.unified.bookmarklet.oneliner.js" \
  "${ROOT_DIR}/docs/ai-chat-export.bookmarklet.oneliner.js" \
  "${ROOT_DIR}/docs/ai-chat-export.unified.bookmarklet.oneliner.js" \
  "${ROOT_DIR}/docs/ai-chat-export.min.js" \
  "${ROOT_DIR}/docs/ai-chat-export.github-pages.oneliner.js" \
  "${ROOT_DIR}/docs/ai-chat-export.github-pages.fetch-loader.oneliner.js"
