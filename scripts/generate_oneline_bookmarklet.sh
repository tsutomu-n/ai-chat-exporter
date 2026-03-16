#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
SRC="${ROOT_DIR}/src/ai-chat-export.js"

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

function replaceMarkedBlock(text, startMarker, endMarker, replacement, label) {
  const start = text.indexOf(startMarker);
  if (start === -1) throw new Error(`Missing ${label} start`);
  const end = text.indexOf(endMarker, start);
  if (end === -1) throw new Error(`Missing ${label} end`);
  return text.slice(0, start) + replacement + text.slice(end + endMarker.length);
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
minimal = replaceMarkedBlock(
  minimal,
  '/*__BOOKMARKLET_MINIMAL_FORMAT_HELPERS_START__*/',
  '/*__BOOKMARKLET_MINIMAL_FORMAT_HELPERS_END__*/',
  `
  formatTimes(value){
    if (this.isJapanese()) return \`\${this.formatNumber(value)}回\`;
    if (this.isChinese()) return \`\${this.formatNumber(value)}次\`;
    return \`\${this.formatNumber(value)} times\`;
  }

  formatPoints(value){
    if (this.isJapanese()) return \`\${this.formatNumber(value)}点\`;
    if (this.isChinese()) return \`\${this.formatNumber(value)}分\`;
    return \`\${this.formatNumber(value)} pts\`;
  }

  yesNo(value){
    if (this.isJapanese()) return value ? 'はい' : 'いいえ';
    if (this.isChinese()) return value ? '是' : '否';
    return value ? 'Yes' : 'No';
  }

  getSiteLabel(){
    return this.adapter.id==='generic'?(this.isJapanese()?'汎用':this.isChinese()?'通用':'Generic'):this.adapter.label;
  }
  `,
  'minimal format/site helpers',
);
minimal = replaceMarkedBlock(
  minimal,
  '/*__BOOKMARKLET_MINIMAL_ROLE_LABEL_START__*/',
  '/*__BOOKMARKLET_MINIMAL_ROLE_LABEL_END__*/',
  `
  roleLabel(role){
    return role==='User'?(this.isJapanese()?'あなた':this.isChinese()?'你':'You'):role==='Model'?'AI':role==='Tool'?(this.isJapanese()?'ツール':this.isChinese()?'工具':'Tool'):(this.isJapanese()?'不明':this.isChinese()?'未知':'Unknown');
  }
  `,
  'minimal roleLabel',
);
minimal = removeBetween(
  minimal,
  "    if (formatId==='json'){\n",
  "\n\n    let out = '';",
  'JSON output branch',
);
minimal = replaceMarkedBlock(
  minimal,
  '/*__BOOKMARKLET_MINIMAL_DIALOGS_START__*/',
  '/*__BOOKMARKLET_MINIMAL_DIALOGS_END__*/',
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

  qualityStatusText(status){
    if (this.isJapanese()){
      if (status==='PASS') return '良好';
      if (status==='WARN') return '注意';
      return '再実行';
    }
    if (this.isChinese()){
      if (status==='PASS') return '良好';
      if (status==='WARN') return '快速检查';
      return '建议重试';
    }
    if (status==='PASS') return 'Good';
    if (status==='WARN') return 'Review';
    return 'Rerun';
  }

  qualityHintText(status){
    if (status==='PASS'){
      return this.isJapanese()
        ? '保存できそうです。'
        : this.isChinese()
        ? '可保存。'
        : 'Ready to save.';
    }
    if (status==='WARN'){
      return this.isJapanese()
        ? '必要なら再実行。'
        : this.isChinese()
        ? '较长时可重试一次。'
        : 'Rerun if needed.';
    }
    return this.isJapanese()
      ? '再実行推奨です。'
      : this.isChinese()
      ? '可能缺失，建议重试。'
      : 'Rerun recommended.';
  }

  largeDeltaHintText(){
    if (this.isJapanese()) return '前回との差が大きいです。';
    if (this.isChinese()) return '与上次差异大。';
    return 'Large delta from previous.';
  }

  largeDeltaLabelText(){
    return this.text('前回との差が大きい', 'large delta from previous', '与上一次差异较大');
  }

  compactDialogText(key){
    const table = {
      title: this.text('保存前の確認', 'Review before saving', '保存确认'),
      cancel: this.text('中止', 'Cancel', '取消'),
      careful_rerun: this.text('ていねいに再実行', 'Careful rerun', '细致重试'),
      copy: this.text('クリップボードにコピー', 'Copy to clipboard', '复制'),
      save: this.text('保存', 'Save file', '保存'),
      copied: this.text('コピーしました。', 'Copied.', '已复制。'),
      copy_failed_save: this.text('コピー失敗。保存へ切り替えます。', 'Copy failed. Saving file.', '复制失败。改为保存文件。')
    };
    return table[key] || '';
  }

  compactResultDialogLines(messages, summary, diff, resultPreset){
    return [
      this.isJapanese()
        ? \`判定: \${summary.label}（\${this.formatPoints(summary.score)}）\`
        : this.isChinese()
        ? \`状态: \${summary.label}（\${this.formatPoints(summary.score)}）\`
        : \`Status: \${summary.label} (\${this.formatPoints(summary.score)})\`,
      summary.hint,
      summary.diffLine || this.comparisonBaseLabel(diff),
      this.isJapanese()
        ? \`件数: \${messages.length}件 / 速度: \${this.getPresetLabelFor(resultPreset)} / 形式: \${this.getFormatLabel()}\`
        : this.isChinese()
        ? \`消息: \${messages.length} / 模式: \${this.getPresetLabelFor(resultPreset)} / 格式: \${this.getFormatLabel()}\`
        : \`Messages: \${messages.length} / Mode: \${this.getPresetLabelFor(resultPreset)} / Format: \${this.getFormatLabel()}\`
    ];
  }
  `,
  'compact config and busy dialogs',
);

let unifiedFirefox = minimal;
unifiedFirefox = replaceRegex(
  unifiedFirefox,
  /\n\s*formatTimes\(value\)\{[\s\S]*?\n\s*getSiteLabel\(\)\{[\s\S]*?\n\s*\}/,
  `
  formatPoints(value){
    if (this.isJapanese()) return \`\${this.formatNumber(value)}点\`;
    if (this.isChinese()) return \`\${this.formatNumber(value)}分\`;
    return \`\${this.formatNumber(value)} pts\`;
  }

  getSiteLabel(){
    return this.adapter.id==='generic'?(this.isJapanese()?'汎用':this.isChinese()?'通用':'Generic'):this.adapter.label;
  }
  `,
  'unified Firefox compact format helpers',
);
unifiedFirefox = replaceMarkedBlock(
  unifiedFirefox,
  '/*__BOOKMARKLET_FIREFOX_SNAPSHOT_SUMMARY_START__*/',
  '/*__BOOKMARKLET_FIREFOX_SNAPSHOT_SUMMARY_END__*/',
  '',
  'result snapshot summary block',
);
unifiedFirefox = replaceMarkedBlock(
  unifiedFirefox,
  '/*__BOOKMARKLET_FIREFOX_QUALITY_SUMMARY_START__*/',
  '/*__BOOKMARKLET_FIREFOX_QUALITY_SUMMARY_END__*/',
  `
  qualitySummary(quality,diff){
    const q = quality || {status:'WARN', score:0};
    const ja = this.isJapanese();
    const zh = this.isChinese ? this.isChinese() : this.getLang&&this.getLang()==='zh-CN';
    const label = this.qualityStatusText(q.status,true);
    let hint = this.qualityHintText(q.status,true);
    let diffLine = '';
    const abortedLast = diff?.lastAttempt?.status==='aborted' || diff?.lastAttempt?.status==='cancel';
    if ((q.weakIdentityMessages||0) > 0 && !q.identityStable){
      hint = ja ? '一部メッセージの識別が弱いです。' : zh ? '部分消息识别较弱。' : 'Some message identities are weak.';
    }else if ((q.unknownMessages||0) > 0){
      hint = ja ? '一部の話者判定が不明です。' : zh ? '部分说话者标签不明。' : 'Some speaker labels are unknown.';
    }
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
      if (Math.abs(delta) > 1){
        hint = this.largeDeltaHintText(true);
      }else if (diff.digestSame){
        hint = ja ? '前回とほぼ同じです。' : zh ? '与上次几乎相同。' : 'Almost identical to previous.';
      }
    }else if (abortedLast){
      diffLine = ja
        ? '前回: 未保存で中断。比較基準はリセットされます。'
        : zh
        ? '上次: 未保存即中断。比较基准会重置。'
        : 'Previous: aborted without saving. Comparison base reset.';
      hint = ja
        ? '以後は今回の保存結果を比較基準にします。'
        : zh
        ? '之后会以这次保存结果作为比较基准。'
        : 'Future comparisons will use this saved result.';
    }
    return {label, hint, diffLine, score:q.score, raw:q};
  }
  `,
  'unified Firefox quality summary block',
);
unifiedFirefox = replaceMarkedBlock(
  unifiedFirefox,
  '/*__BOOKMARKLET_FIREFOX_METADATA_START__*/',
  '/*__BOOKMARKLET_FIREFOX_METADATA_END__*/',
  '',
  'unified Firefox metadata helpers',
);
unifiedFirefox = replaceMarkedBlock(
  unifiedFirefox,
  '/*__BOOKMARKLET_FIREFOX_WARNINGS_START__*/',
  '/*__BOOKMARKLET_FIREFOX_WARNINGS_END__*/',
  `
  warningSummary({quality, diff}){
    const q = quality || {status:'WARN'};
    const ja = this.isJapanese();
    const zh = this.isChinese ? this.isChinese() : this.getLang&&this.getLang()==='zh-CN';
    const parts = [];
    if (!diff?.previous){
      if (diff?.lastAttempt?.status==='aborted' || diff?.lastAttempt?.status==='cancel'){
        parts.push(ja ? '前回未保存で中断' : zh ? '上次未保存即中断' : 'previous run aborted before saving');
      }else{
        parts.push(ja ? '前回データなし' : zh ? '无上次数据' : 'no previous data');
      }
    }
    if (q.status!=='PASS'){
      const statusText = this.qualityStatusText(q.status,true);
      parts.push(ja || zh ? statusText : statusText.toLowerCase());
    }
    if (diff?.previous && Math.abs(diff.diff || 0) > 1){
      parts.push(this.largeDeltaLabelText());
    }
    return {hasWarning: parts.length > 0, text: parts.length ? Array.from(new Set(parts)).join(' / ') : (ja ? 'なし' : zh ? '无' : 'none')};
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
    return ja ? '比較ベース: なし（保存済みなし）' : zh ? '比较基准: 无（没有已保存结果）' : 'Comparison base: none (no saved result)';
  }

  async confirmRerunDialog(mode='careful'){
    const ja = this.isJapanese();
    const zh = this.isChinese ? this.isChinese() : this.getLang&&this.getLang()==='zh-CN';
    const label = mode==='careful' ? (ja ? 'ていねいに再実行' : zh ? '细致重试' : 'Careful rerun') : (ja ? '再実行' : zh ? '重试' : 'Rerun');
    return window.confirm(ja ? \`\${label}しますか？\\n現在の結果を保持して再取得します。\` : zh ? \`\${label}吗？\\n保留当前结果并重试。\` : \`\${label}?\\nKeep the current result and run again.\`);
  }
  `,
  'unified Firefox compact warning and comparison helpers',
);
unifiedFirefox = replaceMarkedBlock(
  unifiedFirefox,
  '/*__BOOKMARKLET_FIREFOX_AUX_OUTPUT_START__*/',
  '/*__BOOKMARKLET_FIREFOX_AUX_OUTPUT_END__*/',
  '',
  'unified Firefox aux output helpers',
);
unifiedFirefox = replaceMarkedBlock(
  unifiedFirefox,
  '/*__BOOKMARKLET_FIREFOX_OUTPUT_DIALOG_START__*/',
  '/*__BOOKMARKLET_FIREFOX_OUTPUT_DIALOG_END__*/',
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

  downloadFile(fileName, content){
    try{
      const type = this.getFormatDef().mime;
      const blob = new Blob([content], {type});
      const url = URL.createObjectURL(blob);
      const a = Utils.el('a',{href:url,download:fileName});
      a.style.display='none';
      document.body.appendChild(a);
      a.click();
      setTimeout(()=>{ try{URL.revokeObjectURL(url);}catch{} try{a.remove();}catch{} }, 12000);
      return true;
    }catch{
      return false;
    }
  }

  async showResultDialog(messages, quality, options={}){
    return new Promise(resolve=>{
      const alternateSnapshot = options?.alternateSnapshot || null;
      const alternateButtonLabel = options?.alternateButtonLabel || this.text('前回結果', 'Previous result', '上一次结果');
      const resultPreset = options?.preset || this.config.preset;
      const diff = this.diffInfo(messages, alternateSnapshot);
      const summary = this.qualitySummary(quality, diff);
      const {fileName, output} = this.formatOutput(messages, quality, diff, resultPreset);
      const manualHint = this.text('保存失敗。下から手動コピーしてください。', 'Save failed. Copy below.', '保存失败。请从下方复制。');

      const ov = this.overlay();
      const modal = Utils.el('div',{style:\`width:min(520px, calc(100vw - 24px));background:\${THEME.surface};border:1px solid \${THEME.border};border-radius:16px;overflow:hidden;box-shadow:0 10px 28px rgba(0,0,0,.4);color:\${THEME.fg};\`});
      const body = Utils.el('div',{style:\`padding:18px;display:grid;gap:10px;background:\${THEME.bg};\`});
      body.appendChild(Utils.el('div',{text:this.compactDialogText('title'),style:'font-size:20px;line-height:1.35;font-weight:700;'}));
      for (const line of this.compactResultDialogLines(messages, summary, diff, resultPreset)){
        body.appendChild(Utils.el('div',{text:line,style:\`font-size:14px;line-height:1.6;color:\${THEME.fg};font-weight:500;\`}));
      }
      const manual = Utils.el('div',{style:\`display:none;border:1px solid \${THEME.border};border-radius:14px;background:\${THEME.surface};padding:12px 14px;\`});
      manual.appendChild(Utils.el('div',{text:this.text('コピー欄', 'Copy area', '复制区'),style:'font-size:13px;line-height:1.5;font-weight:700;margin-bottom:8px;'}));
      const manualText = Utils.el('textarea',{style:\`width:100%;min-height:180px;border-radius:12px;border:1px solid \${THEME.border};background:\${THEME.bg};color:\${THEME.fg};padding:10px 12px;font:500 14px/1.65 \${THEME.mono};\`});
      manualText.value = output;
      manual.appendChild(manualText);
      body.appendChild(manual);

      const footer = Utils.el('div',{style:\`padding:14px 18px;background:\${THEME.surface};border-top:1px solid \${THEME.border};display:flex;gap:10px;justify-content:flex-end;flex-wrap:wrap;\`});
      const finish=(action)=>{
        try{ ov.remove(); }catch{}
        resolve(action);
      };
      const showManual=(stateText)=>{
        manual.style.display = 'block';
        try{
          manualText.focus();
          manualText.select();
          manualText.setSelectionRange(0, manualText.value.length);
        }catch{}
        Utils.toast(stateText || manualHint, 'warn', 3500);
      };

      footer.append(...[
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
              showManual(manualHint);
            }
          }
        }),
        this.btn(this.compactDialogText('save'),'primary', ()=>{
          const ok = this.downloadFile(fileName, output);
          if (ok){
            finish({action:'done_file', saveState:'file'});
          }else{
            showManual(manualHint);
          }
        })
      ].filter(Boolean));

      modal.append(body, footer);
      ov.appendChild(modal);
      document.body.appendChild(ov);
    });
  }
  `,
  'unified Firefox compact output and dialog block',
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

node - "${TMP_CHROME_MIN}" "${TMP_FIREFOX_MIN}" "${ROOT_DIR}" <<'NODE'
const fs = require('fs');
const path = require('path');

const [, , chromeMinPath, firefoxMinPath, rootDir] = process.argv;
const minifiedBodies = {
  chrome: fs.readFileSync(chromeMinPath, 'utf8').trim(),
  firefox: fs.readFileSync(firefoxMinPath, 'utf8').trim(),
};
const variants = [
  { browser: 'chrome', lang: 'ja', fileName: 'ai-chat-export.chrome.ja.bookmarklet.oneliner.js', docsFileName: 'docs/ai-chat-export.chrome.ja.bookmarklet.oneliner.js' },
  { browser: 'chrome', lang: 'en', fileName: 'ai-chat-export.chrome.en.bookmarklet.oneliner.js', docsFileName: 'docs/ai-chat-export.chrome.en.bookmarklet.oneliner.js' },
  { browser: 'chrome', lang: 'zh-CN', fileName: 'ai-chat-export.chrome.zh-CN.bookmarklet.oneliner.js', docsFileName: 'docs/ai-chat-export.chrome.zh-CN.bookmarklet.oneliner.js' },
  { browser: 'firefox', lang: 'ja', fileName: 'ai-chat-export.firefox.ja.bookmarklet.oneliner.js', docsFileName: 'docs/ai-chat-export.firefox.ja.bookmarklet.oneliner.js' },
  { browser: 'firefox', lang: 'en', fileName: 'ai-chat-export.firefox.en.bookmarklet.oneliner.js', docsFileName: 'docs/ai-chat-export.firefox.en.bookmarklet.oneliner.js' },
  { browser: 'firefox', lang: 'zh-CN', fileName: 'ai-chat-export.firefox.zh-CN.bookmarklet.oneliner.js', docsFileName: 'docs/ai-chat-export.firefox.zh-CN.bookmarklet.oneliner.js' },
];

function buildVariantBookmarklet(minifiedBody, lang) {
  let body = String(minifiedBody || '').trim();
  if (body.startsWith('javascript:')) body = body.slice('javascript:'.length);
  const marker = JSON.stringify('__AI_CHAT_EXPORT_BUILD_FIXED_VARIANT_LANG__');
  if (!body.includes(marker)) {
    throw new Error(`Missing fixed-lang marker for ${lang}`);
  }
  body = body.replaceAll(marker, JSON.stringify(lang));
  return `javascript:${body}`;
}

function assertVariantBookmarklet(bookmarklet, variant) {
  if (bookmarklet.includes('globalThis.__AI_CHAT_EXPORT_VARIANT_LANG__=')) {
    throw new Error(`Global fixed-lang mutation leaked into ${variant.browser}.${variant.lang}`);
  }
  if (variant.browser === 'firefox' && bookmarklet.includes('window.prompt(')) {
    throw new Error(`Prompt fallback leaked into ${variant.browser}.${variant.lang}`);
  }
  if (/[^\x00-\x7F]/.test(bookmarklet)) {
    throw new Error(`Non-ASCII byte leaked into ${variant.browser}.${variant.lang}`);
  }
  if (variant.browser === 'firefox' && bookmarklet.length >= 64500) {
    throw new Error(`Firefox bookmarklet exceeded size budget for ${variant.browser}.${variant.lang}: ${bookmarklet.length}`);
  }
}

for (const variant of variants) {
  const bookmarklet = buildVariantBookmarklet(minifiedBodies[variant.browser], variant.lang);
  assertVariantBookmarklet(bookmarklet, variant);
  for (const relativePath of [variant.fileName, variant.docsFileName]) {
    const dstPath = path.join(rootDir, relativePath);
    fs.writeFileSync(dstPath, `${bookmarklet}\n`);
    console.log(`Generated ${dstPath} (${bookmarklet.length} chars)`);
  }
}
NODE

rm -f \
  "${ROOT_DIR}"/ai-chat-export.{chrome,firefox}.bookmarklet.oneliner.js \
  "${ROOT_DIR}/ai-chat-export.bookmarklet.oneliner.js" \
  "${ROOT_DIR}/ai-chat-export.unified.bookmarklet.oneliner.js" \
  "${ROOT_DIR}"/docs/ai-chat-export.{chrome,firefox}.bookmarklet.oneliner.js \
  "${ROOT_DIR}/docs/ai-chat-export.bookmarklet.oneliner.js" \
  "${ROOT_DIR}/docs/ai-chat-export.unified.bookmarklet.oneliner.js" \
  "${ROOT_DIR}/docs/ai-chat-export.min.js" \
  "${ROOT_DIR}/docs/ai-chat-export.github-pages.oneliner.js" \
  "${ROOT_DIR}/docs/ai-chat-export.github-pages.fetch-loader.oneliner.js"
