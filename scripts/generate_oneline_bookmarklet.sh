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
minimal = replaceRegex(
  minimal,
  /const FORMAT_TEXT = Object\.freeze\(\{[\s\S]*?\n\}\);/,
  `const FORMAT_TEXT=Object.freeze({std:Object.freeze({label:{ja:'Markdown',en:'Markdown','zh-CN':'Markdown'},hint:{ja:'',en:'','zh-CN':''}}),txt:Object.freeze({label:{ja:'プレーンテキスト',en:'Plain text','zh-CN':'纯文本'},hint:{ja:'',en:'','zh-CN':''}})});`,
  'minimal FORMAT_TEXT',
);
minimal = replaceRegex(
  minimal,
  /\n\s*languageDescription\(lang\)\{[\s\S]*?\n\s*storageKeys\(\)\{/,
  `
  storageKeys(){`,
  'minimal languageDescription',
);
minimal = replaceRegex(
  minimal,
  /\n\s*formatTimes\(value\)\{[\s\S]*?\n\s*getSiteLabel\(\)\{/,
  `
  getSiteLabel(){`,
  'minimal format helpers',
);
minimal = replaceRegex(
  minimal,
  /\n\s*getSiteLabel\(\)\{[\s\S]*?\n\s*languageLabel\(lang\)\{/,
  `
  getSiteLabel(){
    return this.adapter.id==='generic'?(this.isJapanese()?'汎用':this.isChinese()?'通用':'Generic'):this.adapter.label;
  }

  languageLabel(lang){`,
  'minimal site label',
);
minimal = replaceRegex(
  minimal,
  /\n\s*roleLabel\(role\)\{[\s\S]*?\n\s*yamlValue\(v\)\{/,
  `
  roleLabel(role){
    return role==='User'?(this.isJapanese()?'あなた':this.isChinese()?'你':'You'):role==='Model'?'AI':role==='Tool'?(this.isJapanese()?'ツール':this.isChinese()?'工具':'Tool'):(this.isJapanese()?'不明':this.isChinese()?'未知':'Unknown');
  }

  yamlValue(v){`,
  'minimal roleLabel',
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
            Utils.toast(this.text('コピーできなかったため、ファイル保存に切り替えます。', 'Clipboard copy failed, switching to file save.', '复制到剪贴板失败，改为保存文件。'), 'warn', 3200);
            const ok = this.downloadFile(currentFileName, output);
            if (ok){
              await finalizeWithState({action:'done_file', saveState:'file'}, this.text('ファイル保存済み', 'Saved as file', '已保存为文件'));
            }else{
              setSaveState(this.text('コピー/保存に失敗', 'Copy/save failed', '复制/保存失败'));
              Utils.toast(this.text('保存に失敗しました。', 'Save failed.', '保存失败。'), 'error', 2200);
              finish({action:'done_fail', saveState:'failed'});
            }
          }`,
  `          }catch{
            try{
              window.prompt(this.text('コピーできなかったため、この欄から手動でコピーしてください。', 'Copy failed. Copy the text manually from this prompt.', '复制失败。请从这个输入框手动复制文本。'), output);
            }catch{
              Utils.toast(this.text('コピーできませんでした。保存（ファイル）を使ってください。', 'Copy failed. Use Save file instead.', '复制失败。请改用保存文件。'),'warn', 3200);
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
      const zh = this.isChinese ? this.isChinese() : this.getLang&&this.getLang()==='zh-CN';
      const ov = this.overlay();
      const modal = Utils.el('div',{style:\`width:min(460px, calc(100vw - 24px));background:\${THEME.surface};border:1px solid \${THEME.border};border-radius:16px;overflow:hidden;box-shadow:0 10px 28px rgba(0,0,0,.4);color:\${THEME.fg};\`});
      const body = Utils.el('div',{style:'padding:16px;display:grid;gap:10px;'});
      const title = Utils.el('div',{text:ja?'AIチャットを書き出す':zh?'导出 AI 对话':'Export AI chat',style:'font-size:18px;line-height:1.35;font-weight:700;'});
      const site = Utils.el('div',{text:ja?\`サイト: \${this.getSiteLabel()}\`:zh?\`站点: \${this.getSiteLabel()}\`:\`Site: \${this.getSiteLabel()}\`,style:\`font-size:13px;line-height:1.6;color:\${THEME.muted};font-weight:600;\`});
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
      body.appendChild(row(ja?'言語':zh?'语言':'Language', chips([
        {id:'en',label:'English'},
        {id:'ja',label:'日本語'},
        {id:'zh-CN',label:'中文'}
      ], this.getLang(), (lang)=>{ this.config.lang=lang; this.saveConfig(); ov.remove(); this.showConfigDialog().then(resolve); })));
      body.appendChild(row(ja?'速度':zh?'运行模式':'Mode', chips([
        {id:'fast',label:this.getPresetLabelFor('fast')},
        {id:'normal',label:this.getPresetLabelFor('normal')},
        {id:'careful',label:this.getPresetLabelFor('careful')}
      ], this.config.preset, (preset)=>{ this.applyPreset(preset); this.saveConfig(); ov.remove(); this.showConfigDialog().then(resolve); })));
      body.appendChild(row(ja?'形式':zh?'格式':'Format', chips(FORMAT_ORDER.map(id=>({id,label:this.getFormatDefFor(id).label})), this.getFormatId(), (id)=>{ this.config.fmt=id; this.saveConfig(); ov.remove(); this.showConfigDialog().then(resolve); })));
      if (this.getFormatId()==='txt'){
        const txt = Utils.el('label',{style:'display:flex;gap:8px;align-items:flex-start;font-size:13px;line-height:1.6;'});
        const cb = Utils.el('input',{type:'checkbox',style:'margin-top:3px;'});
        cb.checked = !!this.config.txtHeader;
        cb.addEventListener('change', ()=>{ this.config.txtHeader=cb.checked; this.saveConfig(); });
        txt.append(cb, Utils.el('span',{text:ja?'会話ヘッダーを付ける':zh?'含对话头部':'Include header'}));
        body.appendChild(txt);
      }
      const footer = Utils.el('div',{style:\`padding:14px 16px;background:\${THEME.bg};border-top:1px solid \${THEME.border};display:flex;gap:10px;justify-content:flex-end;\`});
      footer.append(
        this.btn(ja?'キャンセル':zh?'取消':'Cancel','subtle', ()=>{ ov.remove(); resolve(false); }),
        this.btn(ja?'開始':zh?'开始':'Start','primary', ()=>{ ov.remove(); resolve(true); })
      );
      modal.append(body, footer);
      ov.appendChild(modal);
      document.body.appendChild(ov);
    });
  }

  showBusyDialog(){
    const ja = this.isJapanese();
    const zh = this.isChinese ? this.isChinese() : this.getLang&&this.getLang()==='zh-CN';
    const ov = this.overlay();
    const modal = Utils.el('div',{style:\`width:min(420px, calc(100vw - 24px));background:\${THEME.surface};border:1px solid \${THEME.border};border-radius:16px;overflow:hidden;box-shadow:0 10px 28px rgba(0,0,0,.4);color:\${THEME.fg};\`});
    const body = Utils.el('div',{style:'padding:16px;display:grid;gap:8px;'});
    const title = Utils.el('div',{text:ja?'処理中':zh?'处理中':'Working',style:'font-size:18px;line-height:1.35;font-weight:700;'});
    const info = Utils.el('div',{text:ja?'会話を集めています…':zh?'正在收集消息…':'Collecting…',style:\`font-size:13px;line-height:1.6;color:\${THEME.muted};font-weight:500;\`});
    body.append(title, info);
    const footer = Utils.el('div',{style:\`padding:12px 16px;background:\${THEME.bg};border-top:1px solid \${THEME.border};display:flex;justify-content:flex-end;\`});
    footer.append(this.btn(ja?'中断':zh?'中止':'Abort','danger', ()=>{ this.abortState.aborted=true; Utils.toast(ja?'中断しました。':zh?'已中止。':'Aborted.','warn'); }));
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
    const zh = this.isChinese ? this.isChinese() : this.getLang&&this.getLang()==='zh-CN';
    this.busyUI.title.textContent = stage==='final' ? (ja?'最終確認中':zh?'正在做最后检查':'Final checks') : (ja?'処理中':zh?'处理中':'Working');
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
    const zh = this.isChinese ? this.isChinese() : this.getLang&&this.getLang()==='zh-CN';
    const label = this.qualityStatusText(q.status,true);
    const color = q.status==='PASS' ? THEME.ok : q.status==='WARN' ? THEME.warn : THEME.bad;
    let hint = this.qualityHintText(q.status,true);
    let diffLine = '';
    if (diff?.previous){
      const prev = diff.previous.count;
      const now = diff.now.count;
      const delta = diff.diff || 0;
      const sign = delta>0 ? '+' : '';
      diffLine = ja
        ? \`\${diff.previousLabel || '前回'}: \${prev}件 / 今回: \${now}件（差分 \${sign}\${delta}件）\`
        : zh
        ? \`\${diff.previousLabel || '上一次'}: \${prev}条 / 本次: \${now}条（差值 \${sign}\${delta}条）\`
        : \`\${diff.previousLabel || 'Previous'}: \${prev} / Now: \${now} (delta \${sign}\${delta})\`;
      if (Math.abs(delta) > 1) hint = this.largeDeltaHintText(true);
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
  warningSummary({quality, diff}){
    const q = quality || {status:'WARN'};
    const ja = this.isJapanese();
    const zh = this.isChinese ? this.isChinese() : this.getLang&&this.getLang()==='zh-CN';
    const parts = [];
    if (q.status!=='PASS'){
      const statusText = this.qualityStatusText(q.status,true);
      parts.push(ja || zh ? statusText : statusText.toLowerCase());
    }
    if (diff?.previous){
      const diffAbs = Math.abs(diff.diff || 0);
      if (diffAbs > 1) parts.push(this.largeDeltaLabelText());
    }
    const text = parts.length ? parts.join(' / ') : (ja ? 'なし' : zh ? '无' : 'none');
    return {hasWarning: parts.length > 0, text};
  }

  compactSummaryLines(messages, quality, diff, savedState='未保存'){
    const ja = this.isJapanese();
    const zh = this.isChinese ? this.isChinese() : this.getLang&&this.getLang()==='zh-CN';
    const delta = diff?.diff || 0;
    const diffLine = diff?.previous
      ? (ja ? \`前回比: \${delta>0?'+':''}\${delta}件\` : zh ? \`与上次相比: \${delta>0?'+':''}\${delta}条\` : \`Delta: \${delta>0?'+':''}\${delta}\`)
      : (ja ? '前回比: なし' : zh ? '与上次相比: 无' : 'Delta: none');
    return ja
      ? [\`抽出件数: \${messages.length}件\`, \`保存状態: \${savedState}\`, diffLine]
      : zh
      ? [\`提取: \${messages.length}条\`, \`状态: \${savedState}\`, diffLine]
      : [\`Messages: \${messages.length}\`, \`Saved state: \${savedState}\`, diffLine];
  }

  lastAttemptStatusLabel(){
    const {previous} = this.loadRunMeta();
    return this.isJapanese()
      ? \`最終保存: \${Number.isFinite(previous?.count) ? \`\${previous.count}件\` : 'なし'}\`
      : (this.isChinese ? this.isChinese() : this.getLang&&this.getLang()==='zh-CN')
      ? \`上次: \${Number.isFinite(previous?.count) ? \`\${previous.count}条\` : '无'}\`
      : \`Last saved: \${Number.isFinite(previous?.count) ? \`\${previous.count}\` : 'none'}\`;
  }

  comparisonBaseLabel(diff){
    const ja = this.isJapanese();
    const zh = this.isChinese ? this.isChinese() : this.getLang&&this.getLang()==='zh-CN';
    const count = diff?.previous?.count;
    if (Number.isFinite(count)){
      if (diff?.comparisonKind === 'snapshot'){
        const label = diff.previousLabel || (ja ? '前回結果' : zh ? '上一次结果' : 'Previous result');
        return ja ? \`比較ベース: \${label}（\${count}件）\` : zh ? \`比较基准: \${label}（\${count}条）\` : \`Comparison base: \${label} (\${count})\`;
      }
      return ja ? \`比較ベース: \${count}件\` : zh ? \`比较基准: \${count}条\` : \`Comparison base: \${count}\`;
    }
    return ja ? '比較ベース: なし' : zh ? '比较基准: 无' : 'Comparison base: none';
  }

  async confirmRerunDialog(mode='normal'){
    const ja = this.isJapanese();
    const zh = this.isChinese ? this.isChinese() : this.getLang&&this.getLang()==='zh-CN';
    const label = mode==='careful' ? (ja ? 'ていねいに再実行' : zh ? '细致重试' : 'Careful rerun') : (ja ? '再実行' : zh ? '重试' : 'Rerun');
    return window.confirm(ja ? \`\${label}しますか？\\n現在結果を保持して再取得します。\` : zh ? \`\${label}吗？\\n保留当前结果并重试。\` : \`\${label}?\\nKeep the current result and run again.\`);
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
      const isZh = this.isChinese ? this.isChinese() : this.getLang&&this.getLang()==='zh-CN';
      const alternateSnapshot = options?.alternateSnapshot || null;
      const alternateButtonLabel = options?.alternateButtonLabel || (isJa ? '前回結果' : isZh ? '上一次结果' : 'Previous result');
      const resultPreset = options?.preset || this.config.preset;
      const diff = this.diffInfo(messages, alternateSnapshot);
      const summary = this.qualitySummary(quality, diff);
      const {fileName, output} = this.formatOutput(messages, quality, diff, resultPreset);

      const ov = this.overlay();
      const modal = Utils.el('div',{style:\`width:min(520px, calc(100vw - 24px));background:\${THEME.surface};border:1px solid \${THEME.border};border-radius:16px;overflow:hidden;box-shadow:0 10px 28px rgba(0,0,0,.4);color:\${THEME.fg};\`});
      const body = Utils.el('div',{style:\`padding:18px;display:grid;gap:10px;background:\${THEME.bg};\`});
      body.appendChild(Utils.el('div',{text:this.compactDialogText('title'),style:'font-size:20px;line-height:1.35;font-weight:700;'}));
      const lines = this.compactResultDialogLines(messages, summary, diff, resultPreset);
      for (const line of lines){
        body.appendChild(Utils.el('div',{text:line,style:\`font-size:14px;line-height:1.6;color:\${THEME.fg};font-weight:500;\`}));
      }

      const footer = Utils.el('div',{style:\`padding:14px 18px;background:\${THEME.surface};border-top:1px solid \${THEME.border};display:flex;gap:10px;justify-content:flex-end;flex-wrap:wrap;\`});
      const finish=(action)=>{
        try{ ov.remove(); }catch{}
        resolve(action);
      };

      const footerButtons = [
        this.btn(this.compactDialogText('cancel'),'subtle', ()=>finish({action:'cancel'})),
        alternateSnapshot ? this.btn(alternateButtonLabel,'secondary', ()=>finish({action:'show_alternate_result'})) : null,
        this.btn(this.compactDialogText('careful_rerun'),'secondary', async ()=>{
          if (await this.confirmRerunDialog('careful')) finish({action:'rerun_careful'});
        }),
        this.btn(this.compactDialogText('copy'),'secondary', async ()=>{
          try{
            await navigator.clipboard.writeText(output);
            Utils.toast(this.compactDialogText('copied'),'success');
            finish({action:'done_clipboard', saveState:'clipboard'});
          }catch{
            Utils.toast(this.compactDialogText('copy_failed_save'),'warn', 3200);
            const ok = this.downloadFile(fileName, output);
            if (ok){
              finish({action:'done_file', saveState:'file'});
            }else{
              try{
                window.prompt(this.compactDialogText('manual_copy_prompt'), output);
              }catch{
                Utils.toast(this.compactDialogText('copy_save_failed'),'warn', 3200);
              }
            }
          }
        }),
        this.btn(this.compactDialogText('save'),'primary', ()=>{
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
unifiedFirefox = replaceRegex(
  unifiedFirefox,
  /\n\s*formatOutput\(messages, quality, diff, preset=this\.config\.preset\)\{[\s\S]*?\n\s*downloadFile\(fileName, content\)\{/,
  `
  formatOutput(messages, quality, diff, preset=this.config.preset){
    const title = this.adapter.getTitle();
    const savedAt = Utils.formatDateJST(new Date());
    const site = this.getSiteLabel();
    const url = location.href;
    const fmt = this.getFormatDef();
    const zh = this.isChinese ? this.isChinese() : this.getLang&&this.getLang()==='zh-CN';
    const warning = this.warningSummary({quality, diff}).text;
    let out = '';
    if (this.getFormatId()==='txt'){
      if (this.isTxtHeaderEnabled()){
        out += this.isJapanese()
          ? \`\${title}\\n\\n- 形式: \${fmt.label}\\n- サイト: \${site}\\n- 保存日時: \${savedAt}\\n- URL: \${url}\\n- 会話数: \${messages.length}\\n- 警告: \${warning}\\n\\n================\\n\\n\`
          : zh
          ? \`\${title}\\n\\n- 格式: \${fmt.label}\\n- 站点: \${site}\\n- 时间: \${savedAt}\\n- URL: \${url}\\n- 消息: \${messages.length}\\n- 警告: \${warning}\\n\\n================\\n\\n\`
          : \`\${title}\\n\\n- Format: \${fmt.label}\\n- Site: \${site}\\n- Saved at: \${savedAt}\\n- URL: \${url}\\n- Messages: \${messages.length}\\n- Warning: \${warning}\\n\\n================\\n\\n\`;
      }
      for (let i=0;i<messages.length;i++){
        const m = messages[i];
        const body = PlainTextFormatter.fromMarkdown(m.content || '');
        out += \`\${this.roleLabel(m.role)}:\\n\${body || (this.isJapanese() ? '(空)' : zh ? '(空)' : '(empty)')}\\n\\n\`;
        if (i < messages.length-1) out += \`----------------\\n\\n\`;
      }
      return {fileName:this.makeFileName(title), output: out.trim()+'\\n'};
    }
    out += \`# \${title}\\n\\n\`;
    out += this.isJapanese()
      ? \`- サイト: \${site}\\n- 保存日時: \${savedAt}\\n- URL: \${url}\\n- 会話数: \${messages.length}\\n\\n---\\n\\n\`
      : zh
      ? \`- 站点: \${site}\\n- 时间: \${savedAt}\\n- URL: \${url}\\n- 消息: \${messages.length}\\n\\n---\\n\\n\`
      : \`- Site: \${site}\\n- Saved at: \${savedAt}\\n- URL: \${url}\\n- Messages: \${messages.length}\\n\\n---\\n\\n\`;
    for (let i=0;i<messages.length;i++){
      const m = messages[i];
      out += \`## \${this.roleLabel(m.role)}\\n\\n\${(m.content||'').trim()}\\n\\n\`;
      if (i < messages.length-1) out += \`---\\n\\n\`;
    }
    return {fileName:this.makeFileName(title), output: out.trim()+'\\n'};
  }

  downloadFile(fileName, content){`,
  'unified Firefox compact formatOutput body',
);
unifiedFirefox = replaceRegex(
  unifiedFirefox,
  /\n\s*yamlValue\(v\)\{[\s\S]*?\n\s*warningSummary\(\{quality, diff\}\)\{/,
  `
  warningSummary({quality, diff}){`,
  'unified Firefox removes yaml helpers',
);

fs.writeFileSync(minimalBodyPath, `${minimal}\n`);
fs.writeFileSync(unifiedFirefoxBodyPath, `${unifiedFirefox}\n`);
NODE

if command -v bunx >/dev/null 2>&1; then
  bunx terser "${TMP_MINIMAL_BODY}" --compress 'passes=5,toplevel=true,unsafe=true,pure_getters=true' --mangle 'toplevel=true' --format ascii_only=true --output "${TMP_CHROME_MIN}"
  bunx terser "${TMP_UNIFIED_FIREFOX_BODY}" --compress 'passes=5,toplevel=true,unsafe=true,pure_getters=true' --mangle 'toplevel=true' --format ascii_only=true --output "${TMP_FIREFOX_MIN}"
else
  npx --yes terser "${TMP_MINIMAL_BODY}" --compress 'passes=5,toplevel=true,unsafe=true,pure_getters=true' --mangle 'toplevel=true' --format ascii_only=true --output "${TMP_CHROME_MIN}"
  npx --yes terser "${TMP_UNIFIED_FIREFOX_BODY}" --compress 'passes=5,toplevel=true,unsafe=true,pure_getters=true' --mangle 'toplevel=true' --format ascii_only=true --output "${TMP_FIREFOX_MIN}"
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
