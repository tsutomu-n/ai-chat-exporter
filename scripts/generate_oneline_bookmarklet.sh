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
  /\n\s*json: Object\.freeze\(\{\n\s*ext:'json',\n\s*mime:'application\/json;charset=utf-8'\n\s*\}\)/,
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
            Utils.toast(isJa ? 'コピーできなかったため、ファイル保存に切り替えます。' : 'Clipboard copy failed, switching to file save.', 'warn', 3200);
            const ok = this.downloadFile(currentFileName, output);
            if (ok){
              await finalizeWithState({action:'done_file', saveState:'file'}, isJa ? 'ファイル保存済み' : 'Saved as file');
            }else{
              setSaveState(isJa ? 'コピー/保存に失敗' : 'Copy/save failed');
              Utils.toast(isJa ? '保存に失敗しました。' : 'Save failed.', 'error', 2200);
              finish({action:'done_fail', saveState:'failed'});
            }
          }`,
  `          }catch{
            try{
              window.prompt(isJa ? 'コピーできなかったため、この欄から手動でコピーしてください。' : 'Copy failed. Copy the text manually from this prompt.', output);
            }catch{
              Utils.toast(isJa ? 'コピーできませんでした。保存（ファイル）を使ってください。' : 'Copy failed. Use Save file instead.','warn', 3200);
            }
          }`,
  'minimal clipboard prompt fallback',
);
minimal = replaceRegex(
  minimal,
  /\n\s*async showConfigDialog\(\)\{[\s\S]*?\n\s*qualitySummary\(quality, diff\)\{/,
  `
  async showConfigDialog(){
    return new Promise(resolve=>{
      const ja = this.isJapanese();
      const ov = this.overlay();
      const modal = Utils.el('div',{style:\`width:min(460px, calc(100vw - 24px));background:\${THEME.surface};border:1px solid \${THEME.border};border-radius:16px;overflow:hidden;box-shadow:0 10px 28px rgba(0,0,0,.4);color:\${THEME.fg};\`});
      const body = Utils.el('div',{style:'padding:16px;display:grid;gap:10px;'});
      const title = Utils.el('div',{text:ja?'AIチャットを書き出す':'Export AI chat',style:'font-size:18px;line-height:1.35;font-weight:700;'});
      const site = Utils.el('div',{text:ja?\`サイト: \${this.getSiteLabel()}\`:\`Site: \${this.getSiteLabel()}\`,style:\`font-size:13px;line-height:1.6;color:\${THEME.muted};font-weight:600;\`});
      const row = (label, children)=>{
        const box = Utils.el('div',{style:'display:grid;gap:8px;'});
        box.appendChild(Utils.el('div',{text:label,style:'font-size:13px;line-height:1.5;font-weight:700;'}));
        box.appendChild(children);
        return box;
      };
      const chips = (items, current, onPick)=>{
        const wrap = Utils.el('div',{style:'display:flex;gap:8px;flex-wrap:wrap;'});
        for (const item of items){
          const active = current===item.id;
          const btn = Utils.el('button',{style:\`padding:8px 10px;border-radius:10px;border:1px solid \${active?THEME.accentLine:THEME.border};background:\${active?'rgba(95,162,255,0.14)':THEME.bg};color:\${THEME.fg};cursor:pointer;font:700 13px/1.4 \${THEME.font};\`});
          btn.textContent = item.label;
          btn.addEventListener('click', ()=>onPick(item.id));
          wrap.appendChild(btn);
        }
        return wrap;
      };
      body.append(title, site);
      body.appendChild(row(ja?'言語':'Language', chips([
        {id:'en',label:'English'},
        {id:'ja',label:'日本語'}
      ], this.getLang(), (lang)=>{ this.config.lang=lang; this.saveConfig(); ov.remove(); this.showConfigDialog().then(resolve); })));
      body.appendChild(row(ja?'速度':'Mode', chips([
        {id:'fast',label:this.getPresetLabelFor('fast')},
        {id:'normal',label:this.getPresetLabelFor('normal')},
        {id:'careful',label:this.getPresetLabelFor('careful')}
      ], this.config.preset, (preset)=>{ this.applyPreset(preset); this.saveConfig(); ov.remove(); this.showConfigDialog().then(resolve); })));
      body.appendChild(row(ja?'形式':'Format', chips(FORMAT_ORDER.map(id=>({id,label:this.getFormatDefFor(id).label})), this.getFormatId(), (id)=>{ this.config.fmt=id; this.saveConfig(); ov.remove(); this.showConfigDialog().then(resolve); })));
      if (this.getFormatId()==='txt'){
        const txt = Utils.el('label',{style:'display:flex;gap:8px;align-items:flex-start;font-size:13px;line-height:1.6;'});
        const cb = Utils.el('input',{type:'checkbox',style:'margin-top:3px;'});
        cb.checked = !!this.config.txtHeader;
        cb.addEventListener('change', ()=>{ this.config.txtHeader=cb.checked; this.saveConfig(); });
        txt.append(cb, Utils.el('span',{text:ja?'会話ヘッダーを付ける':'Include conversation header'}));
        body.appendChild(txt);
      }
      const footer = Utils.el('div',{style:\`padding:14px 16px;background:\${THEME.bg};border-top:1px solid \${THEME.border};display:flex;gap:10px;justify-content:flex-end;\`});
      footer.append(
        this.btn(ja?'キャンセル':'Cancel','subtle', ()=>{ ov.remove(); resolve(false); }),
        this.btn(ja?'開始':'Start','primary', ()=>{ ov.remove(); resolve(true); })
      );
      modal.append(body, footer);
      ov.appendChild(modal);
      document.body.appendChild(ov);
    });
  }

  showBusyDialog(){
    const ja = this.isJapanese();
    const ov = this.overlay();
    const modal = Utils.el('div',{style:\`width:min(420px, calc(100vw - 24px));background:\${THEME.surface};border:1px solid \${THEME.border};border-radius:16px;overflow:hidden;box-shadow:0 10px 28px rgba(0,0,0,.4);color:\${THEME.fg};\`});
    const body = Utils.el('div',{style:'padding:16px;display:grid;gap:8px;'});
    const title = Utils.el('div',{text:ja?'処理中':'Working',style:'font-size:18px;line-height:1.35;font-weight:700;'});
    const info = Utils.el('div',{text:ja?'会話を集めています…':'Collecting messages…',style:\`font-size:13px;line-height:1.6;color:\${THEME.muted};font-weight:500;\`});
    body.append(title, info);
    const footer = Utils.el('div',{style:\`padding:12px 16px;background:\${THEME.bg};border-top:1px solid \${THEME.border};display:flex;justify-content:flex-end;\`});
    footer.append(this.btn(ja?'中断':'Abort','danger', ()=>{ this.abortState.aborted=true; Utils.toast(ja?'中断しました。':'Aborted.','warn'); }));
    modal.append(body, footer);
    ov.appendChild(modal);
    document.body.appendChild(ov);
    this.busyOverlay = ov;
    this.busyUI = {title, desc:info};
  }

  updateBusyDialog(p){
    if (!this.busyUI) return;
    const stage = p?.stage || '';
    const ja = this.isJapanese();
    this.busyUI.title.textContent = stage==='final' ? (ja?'最終確認中':'Final checks') : (ja?'処理中':'Working');
    if (p?.message) this.busyUI.desc.textContent = p.message;
  }

  closeBusyDialog(){
    try{ this.busyOverlay?.remove(); }catch{}
    this.busyOverlay=null;
    this.busyUI=null;
  }

  qualitySummary(quality, diff){`,
  'compact config and busy dialogs',
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
    const ja = this.isJapanese();
    const label = q.status==='PASS' ? (ja ? '良好' : 'Looks good') : q.status==='WARN' ? (ja ? '注意' : 'Review') : (ja ? '再実行' : 'Rerun');
    const color = q.status==='PASS' ? THEME.ok : q.status==='WARN' ? THEME.warn : THEME.bad;
    const hint = q.status==='PASS' ? (ja ? '保存してよさそうです。' : 'This looks ready to save.') : q.status==='WARN' ? (ja ? '必要なら再実行してください。' : 'Rerun if you need a cleaner result.') : (ja ? '再実行推奨です。' : 'Rerunning is recommended.');
    let diffLine = '';
    if (diff?.previous){
      const sign = diff.diff>0 ? '+' : '';
      diffLine = ja
        ? \`\${diff.previousLabel || '前回'}: \${diff.previous.count}件 / 今回: \${diff.now.count}件（差分 \${sign}\${diff.diff}件）\`
        : \`\${diff.previousLabel || 'Previous'}: \${diff.previous.count} / Now: \${diff.now.count} (delta \${sign}\${diff.diff})\`;
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
      site: this.getSiteLabel(),
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
    const ja = this.isJapanese();
    const parts = [];
    if (q.status!=='PASS') parts.push(q.status==='WARN' ? (ja ? '注意' : 'Review') : (ja ? '再実行' : 'Rerun'));
    if (diff?.previous){
      const diffAbs = Math.abs(diff.diff || 0);
      if (diffAbs > 1) parts.push(ja ? \`差分 \${diff.diff>0?'+':''}\${diff.diff}件\` : \`delta \${diff.diff>0?'+':''}\${diff.diff}\`);
    }
    const text = parts.length ? parts.join(' / ') : (ja ? 'なし' : 'none');
    return {hasWarning: parts.length > 0, text};
  }

  compactSummaryLines(messages, quality, diff, savedState='未保存'){
    const ja = this.isJapanese();
    const diffLine = diff?.previous
      ? (ja ? \`前回比: \${diff.diff>0?'+':''}\${diff.diff}件\` : \`Delta: \${diff.diff>0?'+':''}\${diff.diff}\`)
      : (ja ? '前回比: なし' : 'Delta: none');
    return ja
      ? [\`抽出件数: \${messages.length}件\`, \`保存状態: \${savedState}\`, diffLine]
      : [\`Messages: \${messages.length}\`, \`Saved state: \${savedState}\`, diffLine];
  }

  lastAttemptStatusLabel(){
    const {previous} = this.loadRunMeta();
    return this.isJapanese()
      ? \`最終保存: \${Number.isFinite(previous?.count) ? \`\${previous.count}件\` : 'なし'}\`
      : \`Last saved: \${Number.isFinite(previous?.count) ? \`\${previous.count}\` : 'none'}\`;
  }

  comparisonBaseLabel(diff){
    return Number.isFinite(diff?.previous?.count)
      ? (this.isJapanese() ? \`比較ベース: \${diff.previous.count}件\` : \`Comparison base: \${diff.previous.count}\`)
      : (this.isJapanese() ? '比較ベース: なし' : 'Comparison base: none');
  }

  async confirmRerunDialog(mode='normal'){
    const ja = this.isJapanese();
    const label = mode==='careful' ? (ja ? 'ていねいに再実行' : 'Rerun carefully') : (ja ? '再実行' : 'Rerun');
    return window.confirm(ja ? \`\${label}しますか？\\n現在の結果は保持したまま再取得します。\` : \`\${label}?\\nThe current result will be kept while extracting again.\`);
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
      const isJa = this.isJapanese();
      const alternateSnapshot = options?.alternateSnapshot || null;
      const alternateButtonLabel = options?.alternateButtonLabel || (isJa ? '前回結果' : 'Previous result');
      const resultPreset = options?.preset || this.config.preset;
      const diff = this.diffInfo(messages, alternateSnapshot);
      const summary = this.qualitySummary(quality, diff);
      const {fileName, output} = this.formatOutput(messages, quality, diff, resultPreset);

      const ov = this.overlay();
      const modal = Utils.el('div',{style:\`width:min(520px, calc(100vw - 24px));background:\${THEME.surface};border:1px solid \${THEME.border};border-radius:16px;overflow:hidden;box-shadow:0 10px 28px rgba(0,0,0,.4);color:\${THEME.fg};\`});
      const body = Utils.el('div',{style:\`padding:18px;display:grid;gap:10px;background:\${THEME.bg};\`});
      body.appendChild(Utils.el('div',{text:isJa ? '保存前の確認' : 'Review before saving',style:'font-size:20px;line-height:1.35;font-weight:700;'}));
      const lines = [
        isJa ? \`判定: \${summary.label}（\${summary.score}点）\` : \`Status: \${summary.label} (\${summary.score} pts)\`,
        summary.hint,
        summary.diffLine || this.comparisonBaseLabel(diff),
        isJa
          ? \`件数: \${messages.length}件 / 速度: \${this.getPresetLabelFor(resultPreset)} / 形式: \${this.getFormatLabel()}\`
          : \`Messages: \${messages.length} / Mode: \${this.getPresetLabelFor(resultPreset)} / Format: \${this.getFormatLabel()}\`
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
        this.btn(isJa ? '中止' : 'Cancel','subtle', ()=>finish({action:'cancel'})),
        alternateSnapshot ? this.btn(alternateButtonLabel,'secondary', ()=>finish({action:'show_alternate_result'})) : null,
        this.btn(isJa ? 'ていねいに再実行' : 'Rerun carefully','secondary', async ()=>{
          if (await this.confirmRerunDialog('careful')) finish({action:'rerun_careful'});
        }),
        this.btn(isJa ? 'クリップボードにコピー' : 'Copy to clipboard','secondary', async ()=>{
          try{
            await navigator.clipboard.writeText(output);
            Utils.toast(isJa ? 'コピーしました。' : 'Copied to the clipboard.','success');
            finish({action:'done_clipboard', saveState:'clipboard'});
          }catch{
            Utils.toast(isJa ? 'コピーできなかったため、ファイル保存に切り替えます。' : 'Clipboard copy failed, switching to file save.','warn', 3200);
            const ok = this.downloadFile(fileName, output);
            if (ok){
              finish({action:'done_file', saveState:'file'});
            }else{
              try{
                window.prompt(isJa ? 'コピーできなかったため、この欄から手動でコピーしてください。' : 'Copy failed. Copy the text manually from this prompt.', output);
              }catch{
                Utils.toast(isJa ? 'コピーも保存もできませんでした。' : 'Copy and save both failed.','warn', 3200);
              }
            }
          }
        }),
        this.btn(isJa ? '保存' : 'Save file','primary', ()=>{
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
