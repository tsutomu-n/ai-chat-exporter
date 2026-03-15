javascript:(async()=>{'use strict';
/**
 * AIチャット書き出し（日本語UI）
 * - 対象: ChatGPT (chatgpt.com / chat.openai.com) / Claude (claude.ai) / Google AI Studio (aistudio.google.com) / Grok (grok系 / x.com/i/grok) / フォールバック
 * - 形式: Markdown（デフォルト）/ プレーンテキスト / Obsidian向け / JSON
 * - 重要: サイトの表示や規約変更で壊れる可能性があります。壊れたら直す前提の個人ツールです。
 */

function normalizeLangId(lang){
  const raw = String(lang || '').trim().toLowerCase();
  if (!raw) return null;
  if (raw === 'ja' || raw.startsWith('ja-')) return 'ja';
  if (raw === 'en' || raw.startsWith('en-')) return 'en';
  if (raw === 'zh-cn' || raw === 'zh' || raw.startsWith('zh-')) return 'zh-CN';
  return null;
}

function detectPreferredLang(){
  try{
    const raw = String(navigator?.language || navigator?.languages?.[0] || '').toLowerCase();
    if (raw.startsWith('ja')) return 'ja';
    if (raw.startsWith('zh')) return 'zh-CN';
    return 'en';
  }catch{
    return 'en';
  }
}

let runtimeLang = detectPreferredLang();

function getRuntimeLang(){
  return normalizeLangId(runtimeLang) || detectPreferredLang();
}

function setRuntimeLang(lang){
  runtimeLang = normalizeLangId(lang) || detectPreferredLang();
  return runtimeLang;
}

function isJapaneseLang(lang){
  return normalizeLangId(lang || getRuntimeLang()) === 'ja';
}

function isChineseLang(lang){
  return normalizeLangId(lang || getRuntimeLang()) === 'zh-CN';
}

function pickLangText(jaText, enText, zhText, lang){
  const resolved = normalizeLangId(lang || getRuntimeLang()) || 'en';
  if (resolved === 'ja') return jaText;
  if (resolved === 'zh-CN') return zhText;
  return enText;
}

if (window.__AI_CHAT_EXPORT_RUNNING__) {
  try { alert(isJapaneseLang() ? 'すでに実行中です。' : 'Already running.'); } catch {}
  return;
}
window.__AI_CHAT_EXPORT_RUNNING__ = true;

const APP_ID = 'ai-chat-export';
const APP_STORAGE_VER = 'v2';
const Z = 2147483647;

const THEME = {
  bg:'#0f1116', surface:'#141821', fg:'#f5f7fb', border:'#2a3140',
  accent:'#3b82f6', accentHover:'#5b9dff', accentLine:'#5fa2ff',
  ok:'#16a34a', warn:'#d97706', bad:'#dc2626',
  muted:'#c4ccda',
  font:'"Segoe UI Variable Text","Segoe UI","Yu Gothic UI",Meiryo,"Noto Sans JP",sans-serif',
  mono:'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace'
};

const ENABLE_OBSIDIAN_FORMAT = true;
const BASE_FORMAT_DEFS = {
  std: Object.freeze({
    ext:'md',
    mime:'text/markdown;charset=utf-8'
  }),
  txt: Object.freeze({
    ext:'txt',
    mime:'text/plain;charset=utf-8'
  }),
  json: Object.freeze({
    ext:'json',
    mime:'application/json;charset=utf-8'
  })
};
const FORMAT_DEFS = Object.freeze(ENABLE_OBSIDIAN_FORMAT ? {
  ...BASE_FORMAT_DEFS,
  obs: Object.freeze({
    ext:'md',
    mime:'text/markdown;charset=utf-8'
  })
} : BASE_FORMAT_DEFS);
const FORMAT_ORDER = ENABLE_OBSIDIAN_FORMAT ? ['std', 'txt', 'obs', 'json'] : ['std', 'txt', 'json'];
const FORMAT_TEXT = Object.freeze({
  std: Object.freeze({
    label:{ja:'Markdown', en:'Markdown', 'zh-CN':'Markdown'},
    hint:{ja:'読みやすい普通の.md', en:'Readable standard .md', 'zh-CN':'易读的标准 .md'}
  }),
  txt: Object.freeze({
    label:{ja:'プレーンテキスト', en:'Plain text', 'zh-CN':'纯文本'},
    hint:{ja:'装飾なしのテキスト', en:'Plain text without formatting', 'zh-CN':'不带格式的纯文本'}
  }),
  json: Object.freeze({
    label:{ja:'JSON', en:'JSON', 'zh-CN':'JSON'},
    hint:{ja:'機械処理向け', en:'Machine-readable export', 'zh-CN':'适合机器处理的导出'}
  }),
  obs: Object.freeze({
    label:{ja:'Obsidian向け', en:'For Obsidian', 'zh-CN':'用于 Obsidian'},
    hint:{ja:'callout形式', en:'Callout format', 'zh-CN':'Callout 格式'}
  })
});

function normalizeFormatId(fmt){
  return Object.prototype.hasOwnProperty.call(FORMAT_DEFS, fmt) ? fmt : 'std';
}

class Utils{
  static el(tag, props={}, children=null){
    const e=document.createElement(tag);
    for(const [k,v] of Object.entries(props||{})){
      if (k==='style') e.style.cssText = String(v || '');
      else if (k==='text') e.textContent = v;
      else if (k.startsWith('on') && typeof v==='function') e.addEventListener(k.slice(2), v);
      else if (v!==undefined && v!==null) e.setAttribute(k, String(v));
    }
    if (children!=null){
      const arr=Array.isArray(children)?children:[children];
      for(const c of arr){
        if (c==null) continue;
        e.appendChild(typeof c==='string'?document.createTextNode(c):c);
      }
    }
    return e;
  }
  static sleep(ms){ return new Promise(r=>setTimeout(r, ms)); }
  static clamp(n, a, b){ return Math.max(a, Math.min(b, n)); }
  static nowIso(){ return new Date().toISOString(); }
  static isVisible(el){
    if (!el || !(el instanceof Element)) return false;
    const r = el.getBoundingClientRect();
    if (r.width<2 || r.height<2) return false;
    if (r.bottom<0 || r.top>window.innerHeight) return false;
    const cs = getComputedStyle(el);
    if (cs.display==='none' || cs.visibility==='hidden' || cs.opacity==='0') return false;
    return true;
  }
  static toast(msg, kind='info', ms=2200){
    const colors = {info:THEME.accent, success:THEME.ok, warn:THEME.warn, error:THEME.bad};
    const box = Utils.el('div',{style:`position:fixed;left:50%;bottom:18px;transform:translateX(-50%);z-index:${Z};background:${THEME.surface};border:1px solid ${THEME.border};border-left:6px solid ${colors[kind]||THEME.accent};color:${THEME.fg};padding:10px 12px;border-radius:12px;box-shadow:0 8px 20px rgba(0,0,0,.35);max-width:min(92vw,760px);font:500 14px/1.65 ${THEME.font};`},[
      Utils.el('div',{text:msg,style:'white-space:pre-wrap;word-break:break-word;'})
    ]);
    document.body.appendChild(box);
    setTimeout(()=>{ try{box.remove();}catch{} }, ms);
  }
  static safeText(s){ return (s??'').toString().replace(/\u00a0/g,' '); }

  static djb2(str){
    let h=5381;
    for(let i=0;i<str.length;i++){
      h=((h<<5)+h) ^ str.charCodeAt(i);
      h=h>>>0;
    }
    return h.toString(16);
  }

  static normalizeTitle(s){
    s = (s||'').replace(/\s+/g,' ').trim();
    // よくあるサイト接尾語を落とす（壊れてもOKな“ゆるい”整形）
    s = s.replace(/\s*-\s*ChatGPT\s*$/i,'')
         .replace(/\s*\|\s*ChatGPT\s*$/i,'')
         .replace(/\s*-\s*Grok\s*$/i,'')
         .replace(/\s*\|\s*Grok\s*$/i,'');
    return s || this.defaultConversationTitle();
  }

  static defaultConversationTitle(){
    return pickLangText('会話', 'Conversation', '对话');
  }

  static formatDateJST(d){
    const pad=n=>String(n).padStart(2,'0');
    const yyyy=d.getFullYear();
    const mm=pad(d.getMonth()+1);
    const dd=pad(d.getDate());
    const hh=pad(d.getHours());
    const mi=pad(d.getMinutes());
    return `${yyyy}-${mm}-${dd} ${hh}:${mi}`;
  }

  static filenameSafe(s){
    return (s||'').replace(/[\\/:*?"<>|]+/g,'_').replace(/\s+/g,' ').trim().slice(0,120) || 'chat';
  }

  static domPath(el){
    try{
      if (!el || !(el instanceof Element)) return '';
      const parts = [];
      let cur = el;
      let depth = 0;
      while (cur && cur.nodeType === Node.ELEMENT_NODE && depth < 12){
        const tag = (cur.tagName || '').toLowerCase();
        if (!tag) break;
        if (cur.id){
          parts.push(`${tag}#${cur.id}`);
          break;
        }
        const parent = cur.parentElement;
        const siblings = parent ? Array.from(parent.children).filter(x => (x.tagName || '').toLowerCase() === tag) : [];
        const idx = parent ? Math.max(1, siblings.indexOf(cur) + 1) : 1;
        parts.push(`${tag}:nth-of-type(${idx})`);
        cur = parent;
        depth++;
      }
      return parts.reverse().join('>');
    }catch{
      return '';
    }
  }

  static maxFenceRun(text, ch){
    let max = 0;
    let cur = 0;
    const s = String(text || '');
    for (let i=0;i<s.length;i++){
      if (s[i] === ch){
        cur++;
        if (cur > max) max = cur;
      } else {
        cur = 0;
      }
    }
    return max;
  }

  static chooseCodeFence(text, lang=''){
    const body = String(text || '');
    const safeLang = String(lang || '').replace(/[`~\s]+/g,'').trim();
    const backtickLen = Math.max(3, this.maxFenceRun(body, '`') + 1);
    const tildeLen = Math.max(3, this.maxFenceRun(body, '~') + 1);
    const useTilde = safeLang.includes('`') || backtickLen > tildeLen;
    return {
      fence: (useTilde ? '~' : '`').repeat(useTilde ? tildeLen : backtickLen),
      lang: safeLang
    };
  }

  static escapeMarkdownLinkLabel(s){
    return String(s || '')
      .replace(/\\/g,'\\\\')
      .replace(/\[/g,'\\[')
      .replace(/\]/g,'\\]')
      .replace(/\r?\n/g,' ');
  }

  static normalizeExportUrl(raw){
    const s = String(raw || '').trim();
    if (!s) return '';
    if (s.startsWith('#')) return s;
    const low = s.toLowerCase();
    if (low.startsWith('javascript:')) return '';
    if (low.startsWith('data:') || low.startsWith('blob:') || low.startsWith('mailto:') || low.startsWith('tel:')) return s;
    try{
      return new URL(s, location.href).href;
    }catch{
      return s;
    }
  }

  static escapeMarkdownLinkDestination(raw){
    const url = this.normalizeExportUrl(raw);
    if (!url) return '';
    return url.replace(/[\\ ()[\]]/g, ch => encodeURIComponent(ch));
  }
}

class MarkdownParser{
  static extract(root){
    const txt = this.parse(root, {listDepth:0});
    return this.clean(txt);
  }

  static parse(node, ctx){
    if (!node) return '';
    if (node.shadowRoot) return this.parse(node.shadowRoot, ctx);

    if (node.nodeType === Node.TEXT_NODE){
      return Utils.safeText(node.textContent);
    }
    if (node.nodeType !== Node.ELEMENT_NODE){
      return '';
    }

    const el = node;
    const tag = (el.tagName||'').toLowerCase();

    // 非表示は捨てる（クリック展開で現れる想定）
    const cs = getComputedStyle(el);
    if (cs.display==='none' || cs.visibility==='hidden') return '';

    // code block: なるべく <code> だけを見る
    if (tag === 'pre'){
      const code = el.querySelector('code');
      const raw = (code ? code.textContent : el.textContent) || '';
      const lang = code ? ((code.className.match(/language-([\w-]+)/)||[])[1]||'') : '';
      const body = Utils.safeText(raw).replace(/\n{3,}/g,'\n\n').trim();
      if (!body) return '';
      const {fence, lang: safeLang} = Utils.chooseCodeFence(body, lang);
      return `\n${fence}${safeLang}\n${body}\n${fence}\n\n`;
    }

    // 画像
    if (tag === 'img'){
      const imageFallback = pickLangText('画像', 'Image', '图片');
      const alt = Utils.escapeMarkdownLinkLabel(el.getAttribute('alt') || imageFallback);
      const src = Utils.escapeMarkdownLinkDestination(el.getAttribute('src') || '');
      if (src) return `![${alt}](${src})`;
      return `![${alt}](${imageFallback})`;
    }

    // 子のMarkdown
    const childCtx = {...ctx};
    let children = '';
    if (tag === 'ul' || tag === 'ol'){
      childCtx.listDepth = (ctx.listDepth||0) + 1;
      // liだけに絞る（余計なdiv混入を避ける）
      const items = Array.from(el.children).filter(c=> (c.tagName||'').toLowerCase()==='li');
      children = items.map(li=> this.parse(li, childCtx)).join('');
      return `\n${children}\n`;
    } else {
      children = Array.from(el.childNodes).map(c=> this.parse(c, ctx)).join('');
    }

    switch(tag){
      case 'br': return '\n';
      case 'p': case 'div': case 'article': case 'section':
        return `\n${children}\n`;
      case 'h1': return `\n# ${children.trim()}\n`;
      case 'h2': return `\n## ${children.trim()}\n`;
      case 'h3': return `\n### ${children.trim()}\n`;
      case 'h4': return `\n#### ${children.trim()}\n`;
      case 'h5': return `\n##### ${children.trim()}\n`;
      case 'h6': return `\n###### ${children.trim()}\n`;
      case 'strong': case 'b': return `**${children.trim()}**`;
      case 'em': case 'i': return `*${children.trim()}*`;
      case 'code': {
        const t = children.trim();
        if (!t) return '';
        return `\`${t.replace(/`/g,'\\`')}\``;
      }
      case 'a': {
        const hrefRaw = el.getAttribute('href') || '';
        const href = Utils.escapeMarkdownLinkDestination(hrefRaw);
        const label = Utils.escapeMarkdownLinkLabel(children.trim() || hrefRaw || pickLangText('リンク', 'Link', '链接'));
        if (!href) return label;
        return `[${label}](${href})`;
      }
      case 'hr': return `\n---\n`;
      case 'blockquote': {
        const t = children.trim();
        if (!t) return '';
        return `\n> ${t.replace(/\n/g,'\n> ')}\n`;
      }
      case 'li': {
        const depth = ctx.listDepth||1;
        const indent = '  '.repeat(Math.max(0, depth-1));
        const parentTag = (el.parentElement?.tagName||'').toLowerCase();
        const t = children.trim().replace(/\n/g, '\n' + indent + '  ');
        if (!t) return '';
        if (parentTag === 'ol'){
          const siblings = Array.from(el.parentElement?.children||[]).filter(x=> (x.tagName||'').toLowerCase()==='li');
          const idx = siblings.indexOf(el) + 1;
          return `\n${indent}${idx}. ${t}`;
        }
        return `\n${indent}- ${t}`;
      }
      case 'table':
        return `\n${this.tableToMarkdown(el)}\n`;
      default:
        return children;
    }
  }

  static tableToMarkdown(table){
    try{
      const rows = Array.from(table.querySelectorAll('tr'));
      if (!rows.length) return '';
      const matrix = rows.map(r => Array.from(r.querySelectorAll('th,td')).map(c => (c.innerText||'').replace(/\s+/g,' ').trim()));
      const colN = Math.max(...matrix.map(r=>r.length));
      const norm = matrix.map(r => r.concat(Array(colN - r.length).fill('')));
      const headerLike = rows[0].querySelectorAll('th').length>0;
      const header = norm[0];
      const body = norm.slice(1);
      const esc = s => (s||'').replace(/\|/g,'\\|');
      const mkRow = r => `| ${r.map(esc).join(' | ')} |`;
      const sep = `| ${Array(colN).fill('---').join(' | ')} |`;
      if (headerLike){
        return [mkRow(header), sep, ...body.map(mkRow)].join('\n');
      }
      // headerが無い表は、先頭行をヘッダ扱いにせず、空ヘッダを作って崩れを防ぐ
      const emptyHeader = Array(colN).fill('');
      return [mkRow(emptyHeader), sep, ...norm.map(mkRow)].join('\n');
    }catch{
      return '';
    }
  }

  static clean(md){
    md = (md||'').replace(/\r/g,'');
    // UI由来の余計な連続改行を抑える
    md = md.replace(/[ \t]+\n/g,'\n');
    md = md.replace(/\n{4,}/g,'\n\n\n');
    md = md.replace(/\n{3,}$/g,'\n\n');
    return md.trim();
  }
}

class PlainTextFormatter{
  static fromMarkdown(md){
    const src = String(md || '').replace(/\r/g,'');
    if (!src) return '';
    const out = [];
    const lines = src.split('\n');
    let fence = null;

    for (const rawLine of lines){
      if (!fence){
        const open = rawLine.match(/^([`~]{3,})(.*)$/);
        if (open){
          fence = open[1];
          continue;
        }
      } else if (rawLine.trim() === fence){
        fence = null;
        continue;
      }

      if (fence){
        out.push(rawLine.replace(/[ \t]+$/g,''));
        continue;
      }

      if (/^\s*[-*_]{3,}\s*$/.test(rawLine)){
        out.push('');
        continue;
      }

      if (/^\s*\|?(?:\s*:?-{3,}:?\s*\|)+\s*:?-{3,}:?\s*\|?\s*$/.test(rawLine)){
        continue;
      }

      if (/^\s*\|.*\|\s*$/.test(rawLine)){
        const row = rawLine
          .trim()
          .replace(/^\|/,'')
          .replace(/\|$/,'')
          .split('|')
          .map(cell=>this.normalizeInline(cell.replace(/\\\|/g,'|').trim()))
          .join('\t');
        out.push(row);
        continue;
      }

      let line = rawLine.replace(/^\s{0,3}#{1,6}\s+/, '');
      line = line.replace(/^\s*>\s?/,'');
      out.push(this.normalizeInline(line));
    }

    return this.clean(out.join('\n'));
  }

  static normalizeInline(text){
    let line = String(text || '');
    for (let i=0;i<6;i++){
      const next = line
        .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_, alt, url)=>{
          const a = String(alt || '').trim();
          const u = String(url || '').trim();
          if (a && u) return `${a} (${u})`;
          return a || u || pickLangText('画像', 'Image', '图片');
        })
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, url)=>{
          const l = String(label || '').trim();
          const u = String(url || '').trim();
          return u ? `${l} (${u})` : l;
        })
        .replace(/`([^`]+)`/g,'$1')
        .replace(/\*\*([^*]+)\*\*/g,'$1')
        .replace(/\*([^*]+)\*/g,'$1');
      if (next === line) break;
      line = next;
    }
    return line
      .replace(/\\([\\`*_{}\[\]()#+\-.!|>~])/g,'$1')
      .replace(/[ \t]+/g,' ')
      .replace(/[ \t]+$/g,'');
  }

  static clean(text){
    return String(text || '')
      .replace(/\n{3,}/g,'\n\n')
      .split('\n')
      .map(line=>line.replace(/[ \t]+$/g,''))
      .join('\n')
      .trim();
  }
}

// ---------------- Adapters ----------------
class BaseAdapter{
  constructor(){ this.id='generic'; this.label='Generic'; }
  matches(){ return true; }
  getConversationKey(){ return `${location.origin}${location.pathname}`; }
  getTitle(){
    return Utils.normalizeTitle(document.title || Utils.defaultConversationTitle());
  }
  getPreferredScrollContainerSelectors(){ return []; }
  getQualityPolicy(){ return {penalizeWeakIdentity:true}; }
  extractMessages(){
    // 汎用フォールバックは fail-closed に寄せる。
    // “それっぽい”会話ログを作るより、未対応として止める方が安全。
    return [];
  }
  findExpandButtons(root){ return []; }
}

class ChatGPTAdapter extends BaseAdapter{
  constructor(){ super(); this.id='chatgpt'; this.label='ChatGPT'; }
  matches(){
    const h=location.hostname.toLowerCase();
    return h==='chatgpt.com' || h.endsWith('.chatgpt.com') || h==='chat.openai.com';
  }
  getConversationKey(){
    // /c/<id> 等があるならそれを使う
    const m = location.pathname.match(/\/c\/([a-z0-9-]+)/i);
    if (m) return `${location.origin}/c/${m[1]}`;
    return super.getConversationKey();
  }
  getTitle(){
    // ChatGPTはサイドバーや上部にタイトルがあることが多い
    const h = document.querySelector('main h1, header h1, [data-testid="conversation-title"]');
    const t = (h?.textContent||'').trim();
    return Utils.normalizeTitle(t || document.title || Utils.defaultConversationTitle());
  }
  getPreferredScrollContainerSelectors(){
    // だいたい main がスクロール
    return ['main', 'div[role="main"]', 'body'];
  }
  extractMessages(){
    const els = Array.from(document.querySelectorAll('[data-message-author-role]'));
    if (els.length){
      return els.map(el=>{
        const roleRaw = (el.getAttribute('data-message-author-role') || el.dataset.messageAuthorRole || '').toLowerCase();
        const role = roleRaw==='user' ? 'User' : (roleRaw==='assistant' ? 'Model' : (roleRaw||'').includes('tool') ? 'Tool' : 'Model');
        const content = MarkdownParser.extract(el);
        return {role, content, sig:this.nodeSig(el)};
      }).filter(m=>m.content && m.content.length>0);
    }
    // fallback: conversation-turn
    const turns = Array.from(document.querySelectorAll('article[data-testid^="conversation-turn-"], div[data-testid^="conversation-turn-"]'));
    if (!turns.length) return [];
    return turns.map((el,idx)=>{
      let role='Unknown';
      if (el.querySelector('[data-message-author-role="user"]')) role='User';
      else if (el.querySelector('[data-message-author-role="assistant"]')) role='Model';
      const content = MarkdownParser.extract(el);
      return {role, content, sig:this.nodeSig(el)};
    }).filter(m=>m.content && m.content.length>0);
  }
  nodeSig(el){
    // DOMの安定識別子があるなら使う
    const id = el.getAttribute('data-message-id') || el.id || '';
    if (id) return `id:${id}`;
    const path = Utils.domPath(el);
    if (path) return `p:${path}`;
    const txt = (el.innerText||'').replace(/\s+/g,' ').trim().slice(0,500);
    return `h:${Utils.djb2(txt)}`;
  }
  findExpandButtons(root){
    // ChatGPT内の「続きを読む」「Show more」など
    const candidates = Array.from(root.querySelectorAll('button, a[role="button"]'));
    return candidates.filter(b=>{
      const textRaw = (b.textContent||'').trim();
      const t = textRaw.replace(/\s+/g,'');
      if (!t) return false;
      if (!Utils.isVisible(b)) return false;
      // 肯定
      const ok = /^(続きを読む|もっと見る|続き(を)?表示|全文表示|展開|表示を増やす|Showmore|Readmore|Expand|Expandall)$/i.test(t)
        || /(続きを読む|もっと見る|Show more|Read more|Expand|Expand all)/i.test(textRaw);
      if (!ok) return false;
      // 否定（誤爆防止）
      const bad = /(削除|Delete|Remove|ログアウト|Log out|共有|Share|設定|Setting|新しいチャット|New chat|停止|Stop|再生成|Regenerate|Continue generating|Retry|再試行|やり直し)/i.test(textRaw);
      if (bad) return false;
      // リンクのaは危険なので、role=buttonのみ許す（外部遷移防止）
      if (b.tagName.toLowerCase()==='a'){
        const href=b.getAttribute('href')||'';
        if (href && !href.startsWith('#')) return false;
      }
      return true;
    });
  }
}

class AIStudioAdapter extends BaseAdapter{
  constructor(){ super(); this.id='aistudio'; this.label='Google AI Studio'; }
  matches(){
    const h = location.hostname.toLowerCase();
    return h === 'aistudio.google.com' || h.endsWith('.aistudio.google.com') || h.includes('aistudio');
  }
  getConversationKey(){
    return `${location.origin}${location.pathname}${location.search||''}`;
  }
  getTitle(){
    const h = document.querySelector('h1.mode-title, h1.actions, main h1, header h1');
    const t = (h?.textContent||'').trim();
    return Utils.normalizeTitle(t || document.title || Utils.defaultConversationTitle());
  }
  getPreferredScrollContainerSelectors(){
    return ['ms-chat-history', 'main', 'div[role="main"]', 'body'];
  }
  extractMessages(){
    const turns = Array.from(document.querySelectorAll('ms-chat-turn'));
    if (!turns.length) return [];
    const out = [];
    for (const t of turns){
      const container = t.querySelector('.chat-turn-container') || t.closest('.chat-turn-container');
      const className = (container?.className || '').toLowerCase();
      const role = container?.classList?.contains('user') || className.includes('user') ? 'User' : 'Model';
      const contentNode = t.querySelector('.turn-content') || t;
      let content = MarkdownParser.extract(contentNode);
      if (!content || content === 'more_vert'){
        const fallback = Utils.safeText(contentNode.textContent || '').trim();
        content = fallback === 'more_vert' ? '' : fallback;
      }
      if (!content) continue;
      out.push({role, content, sig:this.nodeSig(t)});
    }
    return out;
  }
  nodeSig(el){
    const id = el.getAttribute('data-turn-id') || el.getAttribute('data-message-id') || el.id || '';
    if (id) return `id:${id}`;
    const path = Utils.domPath(el);
    if (path) return `p:${path}`;
    const txt = (el.innerText||'').replace(/\s+/g,' ').trim().slice(0,500);
    return `h:${Utils.djb2(txt)}`;
  }
  findExpandButtons(root){
    const candidates = Array.from(root.querySelectorAll('button, a[role="button"]'));
    return candidates.filter(b=>{
      const text = (b.textContent||'').trim();
      if (!text) return false;
      if (!Utils.isVisible(b)) return false;
      const ok = /(続きを読む|もっと見る|続き|全文|展開|表示を増やす|Show more|Read more|Expand|Expand all)/i.test(text);
      if (!ok) return false;
      const bad = /(削除|Delete|Remove|ログアウト|Log out|共有|Share|設定|Setting|停止|Stop|再生成|Regenerate|Continue generating|Retry|再試行|やり直し)/i.test(text);
      if (bad) return false;
      if (b.tagName.toLowerCase()==='a'){
        const href = b.getAttribute('href')||'';
        if (href && !href.startsWith('#')) return false;
      }
      return true;
    });
  }
}

class GrokAdapter extends BaseAdapter{
  constructor(){ super(); this.id='grok'; this.label='Grok'; }
  matches(){
    const href = String(location.href || '');
    let host = String(location.hostname || '').toLowerCase();
    let path = String(location.pathname || '').toLowerCase();
    try{
      const parsed = new URL(href || `${location.origin || ''}${location.pathname || ''}${location.search || ''}`);
      host = parsed.hostname.toLowerCase();
      path = parsed.pathname.toLowerCase();
    }catch{}
    if (host.includes('grok')) return true;
    if ((host==='x.com'||host.endsWith('.x.com')||host==='twitter.com'||host.endsWith('.twitter.com')) && /^\/i\/grok(?:\/|$)/.test(path)) return true;
    return false;
  }
  getConversationKey(){
    return `${location.origin}${location.pathname}${location.search||''}`;
  }
  getTitle(){
    // Grokのタイトルは安定しないので document.title を素直に使う
    return Utils.normalizeTitle(document.title || Utils.defaultConversationTitle());
  }
  getPreferredScrollContainerSelectors(){
    return ['main', 'div[role="main"]', 'section', 'body'];
  }
  getQualityPolicy(){
    return {penalizeWeakIdentity:false};
  }
  extractMessages(){
    // GrokのDOMは変わりがちなので広めに拾う
    // まずは data-message-author-role が取れるケース
    const roleEls = Array.from(document.querySelectorAll('[data-message-author-role]'));
    if (roleEls.length){
      return roleEls.map(el=>{
        const r=(el.getAttribute('data-message-author-role')||el.dataset.messageAuthorRole||'').toLowerCase();
        const role = r==='user' ? 'User' : 'Model';
        const content = MarkdownParser.extract(el);
        return {role, content, sig:this.nodeSig(el)};
      }).filter(m=>m.content && m.content.length>0);
    }
    const containers = Array.from(document.querySelectorAll('div[id^="response-"]'));
    if (containers.length){
      return containers.map(el=>{
        const role = this.inferRole(el);
        const contentNode = el.querySelector('.message-bubble') || el;
        const content = MarkdownParser.extract(contentNode);
        return {role, content, sig:this.nodeSig(el)};
      }).filter(m=>m.content && m.content.length>0);
    }
    const actionAnchoredTurns = this.extractActionAnchoredTurns();
    if (actionAnchoredTurns.length) return actionAnchoredTurns;
    const xConversationNodes = Array.from(document.querySelectorAll(
      'main article, main [data-testid^="conversation-turn-"], main [data-testid*="grok"], main section'
    ));
    if (xConversationNodes.length){
      return xConversationNodes.map(el=>{
        const role = this.inferRole(el);
        const contentNode = el.querySelector('.message-bubble') || el;
        const content = MarkdownParser.extract(contentNode);
        return {role, content, sig:this.nodeSig(el)};
      }).filter(m=>m.content && m.content.length>0 && m.role!=='Unknown');
    }
    return [];
  }
  extractActionAnchoredTurns(){
    const controls = Array.from(document.querySelectorAll('button[aria-label="Copy text"], button[aria-label="Regenerate"]'));
    if (!controls.length) return [];
    const out = [];
    const seen = new Set();
    for (const control of controls){
      const turnRoot = this.findTurnRootFromControl(control);
      if (!turnRoot) continue;
      const pair = this.extractTurnPairFromRoot(turnRoot);
      for (const message of pair){
        if (!message || !message.content) continue;
        if (seen.has(message.sig)) continue;
        seen.add(message.sig);
        out.push(message);
      }
    }
    return out;
  }
  findTurnRootFromControl(control){
    let node = control?.parentElement || null;
    while (node && node!==document.body){
      const parent = node.parentElement || null;
      if (!parent){
        node = node.parentElement || null;
        continue;
      }
      const siblings = Array.from(parent.children || []);
      const idx = siblings.indexOf(node);
      if (idx>0){
        const textfulBefore = siblings.slice(0, idx).filter(el=>this.extractPlainText(el).length>0);
        if (textfulBefore.length>=2) return parent;
      }
      node = parent;
    }
    return null;
  }
  extractTurnPairFromRoot(root){
    const children = Array.from(root?.children || []);
    if (!children.length) return [];
    const actionIndex = children.findIndex(el=>this.hasTurnActionButtons(el));
    if (actionIndex<=0) return [];
    const candidates = children
      .slice(0, actionIndex)
      .map((el, index)=>({el, index, text:this.extractPlainText(el)}))
      .filter(row=>row.text.length>0);
    if (candidates.length<2) return [];

    const modelCandidate = candidates.reduce((best, row)=>{
      if (!best) return row;
      return row.text.length>best.text.length ? row : best;
    }, null);
    if (!modelCandidate) return [];

    const userCandidate = candidates
      .slice(0, candidates.findIndex(row=>row===modelCandidate))
      .reverse()
      .find(row=>row.text.length>0) || null;

    const out = [];
    if (userCandidate){
      out.push({
        role:'User',
        content:userCandidate.text,
        sig:this.nodeSig(userCandidate.el)
      });
    }
    out.push({
      role:'Model',
      content:modelCandidate.text,
      sig:this.nodeSig(modelCandidate.el)
    });
    return out;
  }
  hasTurnActionButtons(root){
    return !!(root?.querySelector?.('button[aria-label="Copy text"]') || root?.querySelector?.('button[aria-label="Regenerate"]'));
  }
  extractPlainText(root){
    return MarkdownParser.extract(root).replace(/\s+/g,' ').trim();
  }
  inferRole(el){
    const author = (el.getAttribute?.('data-message-author-role') || el.dataset?.messageAuthorRole || '').toLowerCase();
    if (author === 'user' || author === 'human') return 'User';
    if (author === 'assistant' || author === 'model' || author === 'grok') return 'Model';

    const testId = (el.getAttribute?.('data-testid') || '').toLowerCase();
    if (testId.includes('user') || testId.includes('human')) return 'User';
    if (testId.includes('assistant') || testId.includes('model')) return 'Model';

    const className = String(el.className || '').toLowerCase();
    if (className.includes('items-end') || className.includes('justify-end')) return 'User';
    if (className.includes('items-start') || className.includes('justify-start')) return 'Model';

    return 'Unknown';
  }
  nodeSig(el){
    const stableId = el.getAttribute('data-id') || el.id || '';
    if (stableId) return `id:${stableId}`;
    const testId = el.getAttribute('data-testid') || '';
    if (testId) return `testid:${testId}`;
    const path = Utils.domPath(el);
    if (path) return `p:${path}`;
    const txt = (el.innerText||'').replace(/\s+/g,' ').trim().slice(0,500);
    return `h:${Utils.djb2(txt)}`;
  }
  findExpandButtons(root){
    const candidates = Array.from(root.querySelectorAll('button, a[role="button"]'));
    return candidates.filter(b=>{
      const text=(b.textContent||'').trim();
      if (!text) return false;
      if (!Utils.isVisible(b)) return false;
      const ok = /(続きを読む|もっと見る|続き|全文|展開|表示を増やす|Show more|Read more|Expand|Expand all)/i.test(text);
      if (!ok) return false;
      const bad = /(削除|Delete|Remove|ログアウト|Log out|共有|Share|設定|Setting|投稿|Post|返信|Reply|停止|Stop|再生成|Regenerate|Continue generating|Retry|再試行|やり直し)/i.test(text);
      if (bad) return false;
      if (b.tagName.toLowerCase()==='a'){
        const href=b.getAttribute('href')||'';
        if (href && !href.startsWith('#')) return false;
      }
      return true;
    });
  }
}

class ClaudeAdapter extends BaseAdapter{
  constructor(){ super(); this.id='claude'; this.label='Claude'; }
  matches(){
    const host = location.hostname.toLowerCase();
    return host === 'claude.ai' || host.endsWith('.claude.ai');
  }
  getConversationKey(){
    return `${location.origin}${location.pathname}${location.search||''}`;
  }
  getTitle(){
    const h = document.querySelector('main h1, header h1, [data-testid="conversation-title"], [data-testid="chat-title"]');
    const t = (h?.textContent||'').trim();
    return Utils.normalizeTitle(t || document.title || Utils.defaultConversationTitle());
  }
  getPreferredScrollContainerSelectors(){
    return ['[data-testid="chat-messages"]', 'main', 'div[role="main"]', 'body'];
  }
  getQualityPolicy(){
    return {penalizeWeakIdentity:false};
  }
  extractMessages(){
    const collectMessages = (elements, dedupe=false)=>{
      const seen = dedupe ? new Set() : null;
      const out = [];
      for (const el of elements){
        const role = this.inferRole(el);
        const contentNode = el.querySelector?.('[data-testid="message-content"], .prose, .whitespace-pre-wrap') || el;
        const content = MarkdownParser.extract(contentNode);
        if (!content || content.length<=0) continue;
        const sig = this.nodeSig(el);
        if (seen){
          if (seen.has(sig)) continue;
          seen.add(sig);
        }
        out.push({role, content, sig});
      }
      return out;
    };
    const roleCoverage = (messages)=>{
      let score = 0;
      if (messages.some(m=>m.role==='User')) score++;
      if (messages.some(m=>m.role==='Model')) score++;
      return score;
    };

    const explicit = Array.from(document.querySelectorAll(
      '[data-message-author-role], [data-testid="user-message"], [data-testid="human-message"], [data-testid="assistant-message"], [data-testid="claude-message"], [data-testid="model-message"], div.font-claude-response'
    ));
    const explicitMessages = collectMessages(explicit);
    const explicitCoverage = roleCoverage(explicitMessages);
    if (explicitMessages.length && explicitCoverage>=2) return explicitMessages;

    const fallback = Array.from(document.querySelectorAll(
      'main [data-message-id], main [data-testid*="message"], main article, main section'
    ));
    const fallbackMessages = collectMessages(fallback, true);
    if (!explicitMessages.length) return fallbackMessages;
    if (!fallbackMessages.length) return explicitMessages;

    const fallbackCoverage = roleCoverage(fallbackMessages);
    if (fallbackCoverage > explicitCoverage) return fallbackMessages;
    if (fallbackCoverage === explicitCoverage && fallbackMessages.length > explicitMessages.length) return fallbackMessages;
    return explicitMessages;
  }
  inferRole(el){
    const author = (el.getAttribute?.('data-message-author-role') || '').toLowerCase();
    if (author === 'user' || author === 'human') return 'User';
    if (author === 'assistant' || author === 'claude' || author === 'model') return 'Model';

    const testId = (el.getAttribute?.('data-testid') || '').toLowerCase();
    if (testId.includes('user') || testId.includes('human')) return 'User';
    if (testId.includes('assistant') || testId.includes('claude') || testId.includes('model')) return 'Model';

    const className = String(el.className || '').toLowerCase();
    if (className.includes('font-user-message')) return 'User';
    if (className.includes('font-claude-response')) return 'Model';

    return 'Unknown';
  }
  nodeSig(el){
    const stableId = el.getAttribute('data-message-id') || el.id || '';
    if (stableId) return `id:${stableId}`;
    const testId = el.getAttribute('data-testid') || '';
    if (testId) return `testid:${testId}:${Utils.djb2((el.innerText||'').replace(/\s+/g,' ').trim().slice(0,300))}`;
    const path = Utils.domPath(el);
    if (path) return `p:${path}`;
    const txt = (el.innerText||'').replace(/\s+/g,' ').trim().slice(0,500);
    return `h:${Utils.djb2(txt)}`;
  }
  findExpandButtons(root){
    const candidates = Array.from(root.querySelectorAll('button, a[role="button"]'));
    return candidates.filter(b=>{
      const text = (b.textContent||'').trim();
      if (!text) return false;
      if (!Utils.isVisible(b)) return false;
      const ok = /(続きを読む|もっと見る|続き|全文|展開|表示を増やす|Show more|Read more|Expand|Expand all)/i.test(text);
      if (!ok) return false;
      const bad = /(削除|Delete|Remove|ログアウト|Log out|共有|Share|設定|Setting|停止|Stop|再生成|Regenerate|Retry|再試行|やり直し|New chat|新しいチャット)/i.test(text);
      if (bad) return false;
      if (b.tagName.toLowerCase()==='a'){
        const href = b.getAttribute('href')||'';
        if (href && !href.startsWith('#')) return false;
      }
      return true;
    });
  }
}

class AdapterFactory{
  static getAdapter(){
    const adapters = [new ChatGPTAdapter(), new ClaudeAdapter(), new AIStudioAdapter(), new GrokAdapter(), new BaseAdapter()];
    return adapters.find(a=>a.matches()) || new BaseAdapter();
  }
}

// ---------------- Expand Engine ----------------
class ExpandEngine{
  static async run(adapter, root, opt){
    const {
      enabled=true, maxClicks=200, delayMs=180,
      onProgress=null, abortSignal=null
    } = opt||{};
    if (!enabled) return {clicked:0, rounds:0};
    const isAborted = ()=>!!(abortSignal && abortSignal.aborted);
    const isJa = isJapaneseLang(abortSignal?.lang);
    const emit = (p)=>{ if (typeof onProgress==='function') { try{onProgress(p);}catch{} } };

    let clicked=0, rounds=0;
    for(;;){
      if (isAborted()) throw new Error(isJa ? '中断しました' : 'Aborted');
      const btns = adapter.findExpandButtons(root).slice(0, Math.max(0, maxClicks-clicked));
      if (!btns.length) break;
      rounds++;
      for (const b of btns){
        if (isAborted()) throw new Error(isJa ? '中断しました' : 'Aborted');
        try{
          b.click();
          clicked++;
          if (clicked>=maxClicks) break;
        }catch{}
        emit({stage:'expand', message:isJa ? `本文を展開中…（${clicked}回）` : `Expanding collapsed content… (${clicked})`});
        await Utils.sleep(delayMs);
      }
      if (clicked>=maxClicks) break;
      // 少し待ってDOMが落ち着く
      await Utils.sleep(120);
      // 変化が無いなら抜ける（無限ループ防止）
      const again = adapter.findExpandButtons(root).length;
      if (!again) break;
      // 変化があっても同じボタンが残る場合があるので、roundsで制限
      if (rounds>=12) break;
    }
    return {clicked, rounds};
  }
}

// ---------------- Scroll Engine ----------------
class ScrollEngine{
  static getDocumentScroller(){
    return document.scrollingElement || document.documentElement || document.body;
  }

  static getMessageSignalCount(el){
    if (!el || !el.querySelectorAll) return 0;
    const sels = ['[data-message-author-role]','[data-testid^="conversation-turn-"]','article','section','ms-chat-turn','.message-bubble'];
    let c=0;
    for(const s of sels){
      c += el.querySelectorAll(s).length;
      if (c>=80) break;
    }
    return c;
  }

  static findScrollContainer(adapter){
    const rootScroller = this.getDocumentScroller();
    const viewportArea = window.innerWidth*window.innerHeight;
    const candidates=[];

    const push=(el,boost=0)=>{
      if (!el) return;
      const isRoot = el===rootScroller;
      const scrollH = el.scrollHeight;
      const clientH = isRoot ? window.innerHeight : el.clientHeight;
      const range = scrollH-clientH;
      if (!Number.isFinite(range) || range<160) return;

      let score = range + boost;
      if (!isRoot){
        const r=el.getBoundingClientRect();
        const visH = Math.max(0, Math.min(r.bottom, window.innerHeight) - Math.max(r.top, 0));
        const visW = Math.max(0, Math.min(r.right, window.innerWidth) - Math.max(r.left, 0));
        const visA = visH*visW;
        if (visA < viewportArea*0.08) return;
        score += visA*0.02;
        if (visA > viewportArea*0.4) score += 1200;
      } else {
        score += viewportArea*0.02;
      }
      score += this.getMessageSignalCount(el)*900;
      candidates.push({el, score});
    };

    // adapterの優先候補
    for (const sel of (adapter.getPreferredScrollContainerSelectors?.()||[])){
      try{
        const el = document.querySelector(sel);
        if (el) push(el, 1600);
      }catch{}
    }

    // root
    push(rootScroller, 800);

    // overflow候補
    const all = Array.from(document.querySelectorAll('*'));
    for (const el of all){
      const cs = getComputedStyle(el);
      if (cs.overflowY==='auto' || cs.overflowY==='scroll' || cs.overflowY==='overlay'){
        push(el, 0);
      }
    }

    candidates.sort((a,b)=>b.score-a.score);
    return candidates[0]?.el || rootScroller;
  }

  static buildQuality(stats, policy={}){
    const penalizeWeakIdentity = policy.penalizeWeakIdentity !== false;
    const topStableEffectiveHits = Math.max(stats.topStableHits || 0, stats.topSettleStableHits || 0);
    const topConverged = (stats.topReached && topStableEffectiveHits>=stats.stableTarget) || stats.topEarlyExit;
    const bottomConverged = (stats.bottomReached && stats.bottomStableHits>=stats.stableTarget) || stats.bottomEarlyExit;
    const finalStable = stats.isFastPreset
      ? stats.finalNewMessages===0
      : (stats.finalStableHits>=2 && stats.finalNewMessages===0);
    const identityStable = penalizeWeakIdentity ? stats.weakIdentityMessages===0 : true;
    const checks=[topConverged, bottomConverged, finalStable, identityStable];
    const failed=checks.filter(v=>!v).length;
    const status = failed===0?'PASS':(failed===1?'WARN':'FAIL');
    const score = Math.round(((checks.length-failed)/checks.length)*100);
    return {...stats, status, score, topConverged, bottomConverged, finalStable, identityStable, topStableEffectiveHits};
  }

  static async harvest(adapter, cfg, onProgress, abortSignal){
    const emit = (p)=>{ if (typeof onProgress==='function'){ try{onProgress(p);}catch{} } };
    const isAborted = ()=>!!(abortSignal && abortSignal.aborted);
    const isJa = isJapaneseLang(cfg?.lang || abortSignal?.lang);
    const ensure=()=>{ if (isAborted()) throw new Error(isJa ? '中断しました' : 'Aborted'); };

    const container = this.findScrollContainer(adapter);
    const rootScroller = this.getDocumentScroller();
    const isRoot = container===rootScroller;

    const getViewportH = ()=> isRoot ? window.innerHeight : container.clientHeight;
    const getH = ()=> container.scrollHeight;
    const getY = ()=> container.scrollTop;
    const getMaxY = ()=> Math.max(0, getH()-getViewportH());

    const initialY = getY();
    const scrollToY = (y)=>{
      const clamped = Utils.clamp(y, 0, getMaxY());
      if (isRoot){
        window.scrollTo(0, clamped);
        container.scrollTop = clamped;
      } else {
        container.scrollTop = clamped;
      }
      return clamped;
    };

    const messageMap = new Map(); // key -> {role, content, sig, firstSeenCapture, firstSeenDomIndex}
    const orderEdges = new Map(); // key -> Set<nextKey>
    const stats = {
      captures:0,
      topIterations:0,
      topReached:false,
      topStableHits:0,
      topNoChangeHits:0,
      topEarlyExit:false,
      topSettleIterations:0,
      topSettleStableHits:0,
      topSettleNewMessages:0,
      topSettleMergedUpdates:0,
      downIterations:0,
      bottomReached:false,
      bottomStableHits:0,
      bottomNoChangeHits:0,
      bottomEarlyExit:false,
      finalStableHits:0,
      finalNewMessages:0,
      isFastPreset:false,
      expandClicks:0,
      stableTarget:3,
      earlyExitStableTarget: Math.max(4, Math.min(8, Math.ceil((Number(cfg.scrollMax)||0) / 10))),
      mergedUpdates:0,
      unknownMessages:0,
      weakIdentityMessages:0,
      orderGraphCycles:0
    };
    const isFastPreset = cfg.preset === 'fast';
    stats.isFastPreset = isFastPreset;
    const isCarefulPreset = cfg.preset === 'careful';
    const minIterationsBeforeEarlyExit = Math.min(Number(cfg.scrollMax)||0, Math.max(6, stats.earlyExitStableTarget + 2));
    let expandBudgetLeft = Math.max(0, Number(cfg.expandMaxClicks)||0);
    const settleLoops = isFastPreset ? 1 : 2;
    const finalWaitMs = isFastPreset ? 70 : 140;
    const topSettleMaxRounds = isCarefulPreset ? 8 : 0;
    const topSettleStableTarget = 3;
    const topSettleWaitMs = Math.max(240, Math.min(900, Math.round((Number(cfg.scrollDelay)||0) * 1.1)));

    const classifySig = (sig)=>{
      const raw = typeof sig === 'string' ? sig.trim() : '';
      if (!raw) return {sig:'', strong:false, base:''};
      if (raw.startsWith('id:')) return {sig:raw, strong:true, base:raw};
      return {sig:raw, strong:false, base:raw};
    };
    const roleRank = (role)=>{
      if (role === 'User' || role === 'Model' || role === 'Tool') return 2;
      if (role) return 1;
      return 0;
    };
    const roleCompatibleForWeakPromotion = (currentRole, nextRole)=>{
      if (currentRole === nextRole) return true;
      return currentRole === 'Unknown' || nextRole === 'Unknown';
    };
    const contentScore = (content)=>{
      const text = String(content || '').trim();
      return text.length;
    };
    const addEdge = (from, to)=>{
      if (!from || !to || from===to) return;
      if (!orderEdges.has(from)) orderEdges.set(from, new Set());
      orderEdges.get(from).add(to);
    };
    const keyForMessage = (m, weakOrdinalMap)=>{
      const sigInfo = classifySig(m?.sig);
      if (sigInfo.strong) return {key:`sig:${sigInfo.base}`, weak:false, sig:sigInfo.sig};
      const normalized = Utils.safeText(m?.content || '').replace(/\s+/g,' ').trim();
      const weakBase = sigInfo.base || `anon:${Utils.djb2(`${m?.role || 'Unknown'}\u0000${normalized}`)}`;
      const ordinal = (weakOrdinalMap.get(weakBase) || 0) + 1;
      weakOrdinalMap.set(weakBase, ordinal);
      return {key:`weak:${weakBase}#${ordinal}`, weak:true, sig:sigInfo.sig || weakBase};
    };
    const findPromotableWeakKey = (next, usedKeys)=>{
      let bestKey = null;
      let bestDistance = Number.POSITIVE_INFINITY;
      let bestCapture = -1;
      for (const [existingKey, record] of messageMap.entries()){
        if (usedKeys?.has(existingKey)) continue;
        if (!record.weakIdentity) continue;
        if (!roleCompatibleForWeakPromotion(record.role, next.role)) continue;
        const currentContent = String(record.content || '').trim();
        const nextContent = String(next.content || '').trim();
        if (!currentContent || !nextContent) continue;
        const sameContent = currentContent === nextContent || currentContent.includes(nextContent) || nextContent.includes(currentContent);
        if (!sameContent) continue;
        const distance = Math.abs((record.lastSeenDomIndex ?? next.domIndex) - next.domIndex);
        if (distance > 3) continue;
        const captureRank = record.lastSeenCapture ?? 0;
        if (distance < bestDistance || (distance === bestDistance && captureRank > bestCapture)){
          bestKey = existingKey;
          bestDistance = distance;
          bestCapture = captureRank;
        }
      }
      return bestKey;
    };
    const mergeRecord = (record, next)=>{
      const nextContent = String(next.content || '').trim();
      const currentContent = String(record.content || '').trim();
      if (nextContent && nextContent !== currentContent){
        const shouldReplace = contentScore(nextContent) > contentScore(currentContent) || nextContent.includes(currentContent);
        if (shouldReplace){
          if (currentContent) stats.mergedUpdates++;
          record.content = nextContent;
        }
      }
      if (roleRank(next.role) > roleRank(record.role)){
        record.role = next.role;
      }
      if (!record.sig && next.sig) record.sig = next.sig;
      if (classifySig(next.sig).strong){
        record.weakIdentity = false;
        record.sig = next.sig;
      }
      record.lastSeenCapture = stats.captures;
      record.lastSeenDomIndex = next.domIndex;
      return record;
    };
    const topoOrderMessages = ()=>{
      const keys = Array.from(messageMap.keys());
      const indegree = new Map(keys.map(k=>[k,0]));
      for (const [from, tos] of orderEdges.entries()){
        if (!indegree.has(from)) continue;
        for (const to of tos){
          if (!indegree.has(to)) continue;
          indegree.set(to, indegree.get(to)+1);
        }
      }
      const compareKeys = (a,b)=>{
        const ra = messageMap.get(a);
        const rb = messageMap.get(b);
        return (ra.firstSeenCapture-rb.firstSeenCapture)
          || (ra.firstSeenDomIndex-rb.firstSeenDomIndex)
          || a.localeCompare(b);
      };
      const queue = keys.filter(k=>indegree.get(k)===0).sort(compareKeys);
      const ordered = [];
      while (queue.length){
        const key = queue.shift();
        ordered.push(key);
        for (const next of orderEdges.get(key) || []){
          if (!indegree.has(next)) continue;
          indegree.set(next, indegree.get(next)-1);
          if (indegree.get(next)===0){
            queue.push(next);
            queue.sort(compareKeys);
          }
        }
      }
      if (ordered.length !== keys.length){
        stats.orderGraphCycles++;
        const seen = new Set(ordered);
        ordered.push(...keys.filter(k=>!seen.has(k)).sort(compareKeys));
      }
      return ordered.map(k=>messageMap.get(k));
    };

    const capture = ()=>{
      stats.captures++;
      const msgs = adapter.extractMessages();
      const visibleKeys = [];
      const usedKeys = new Set();
      const weakOrdinalMap = new Map();
      for (let i=0;i<msgs.length;i++){
        const m=msgs[i];
        if (!m || !m.content || m.content.length<2) continue;
        const {key, weak, sig} = keyForMessage(m, weakOrdinalMap);
        const next = {
          ...m,
          content: String(m.content || '').trim(),
          role: m.role || 'Unknown',
          domIndex: i,
          sig
        };
        let resolvedKey = key;
        if (!messageMap.has(resolvedKey)){
          const promoteFrom = findPromotableWeakKey(next, usedKeys);
          if (promoteFrom && promoteFrom !== resolvedKey){
            const promoted = messageMap.get(promoteFrom);
            if (promoted){
              if (!weak){
                promoted.weakIdentity = false;
                promoted.sig = next.sig;
              }
              messageMap.delete(promoteFrom);
              messageMap.set(resolvedKey, promoted);
            }
          }
        }
        visibleKeys.push(resolvedKey);
        usedKeys.add(resolvedKey);
        if (!messageMap.has(resolvedKey)){
          messageMap.set(resolvedKey, {
            role: next.role,
            content: next.content,
            sig: next.sig || null,
            weakIdentity: weak,
            firstSeenCapture: stats.captures,
            firstSeenDomIndex: i,
            lastSeenCapture: stats.captures,
            lastSeenDomIndex: i
          });
        } else {
          mergeRecord(messageMap.get(resolvedKey), next);
        }
      }
      for (let i=0;i<visibleKeys.length-1;i++){
        if (visibleKeys[i] !== visibleKeys[i+1]){
          addEdge(visibleKeys[i], visibleKeys[i+1]);
        }
      }
      return messageMap.size;
    };

    const maybeExpand = async (stage)=>{
      if (!cfg.autoExpand) return;
      if (expandBudgetLeft<=0) return;
      // 負荷を抑えるため、ステージごとに間引く
      const interval = stage==='final' ? 1 : 3;
      const iter = (stage==='top') ? stats.topIterations : (stage==='down') ? stats.downIterations : 0;
      if (stage!=='final' && (iter%interval)!==0) return;
      const res = await ExpandEngine.run(adapter, container, {
        enabled: cfg.autoExpand,
        maxClicks: expandBudgetLeft,
        delayMs: cfg.expandClickDelay,
        onProgress: emit,
        abortSignal
      });
      stats.expandClicks += res.clicked;
      expandBudgetLeft = Math.max(0, expandBudgetLeft - res.clicked);
    };

    // stage: prepare
    emit({stage:'prepare', message:isJa ? '会話の位置を確認しています…' : 'Checking where the conversation starts…', count: capture()});
    await maybeExpand('final');
    emit({stage:'prepare', message:isJa ? '会話を検出しました。読み込みを開始します…' : 'Conversation detected. Starting the scan…', count: capture()});
    await Utils.sleep(isFastPreset ? 80 : 180);

    // stage: top
    let lastCount=-1;
    let lastHeight=-1;
    for (let i=0;i<cfg.scrollMax;i++){
      ensure();
      stats.topIterations++;
      emit({stage:'top', message:isJa ? '古い会話を上まで読み込んでいます…' : 'Loading older messages toward the top…', iter:i+1, max:cfg.scrollMax, count: messageMap.size});

      const y = getY();
      const step = getViewportH()*0.85;
      scrollToY(y - step);
      await Utils.sleep(cfg.scrollDelay);

      await maybeExpand('top');
      const c = capture();
      const h = getH();

      const atTop = getY()<=1;
      if (atTop) stats.topReached=true;

      if (c===lastCount && atTop) stats.topStableHits++;
      else if (atTop) stats.topStableHits = Math.max(0, stats.topStableHits-1);
      if (c===lastCount && Math.abs(h-lastHeight)<=2) stats.topNoChangeHits++;
      else stats.topNoChangeHits = 0;

      lastCount = c;
      lastHeight = h;

      if (stats.topReached && stats.topStableHits>=stats.stableTarget) break;
      if (stats.topIterations>=minIterationsBeforeEarlyExit && stats.topNoChangeHits>=stats.earlyExitStableTarget){
        stats.topEarlyExit = true;
        break;
      }
    }

    // stage: top settle
    if (isCarefulPreset && stats.topReached){
      for (let i=0;i<topSettleMaxRounds;i++){
        ensure();
        stats.topSettleIterations++;
        emit({
          stage:'top_settle',
          message:isJa ? '先頭追い込み中…' : 'Settling at the top…',
          iter:i+1,
          max:topSettleMaxRounds,
          count: messageMap.size
        });

        const beforeCount = messageMap.size;
        const beforeHeight = getH();
        const beforeMergedUpdates = stats.mergedUpdates;

        scrollToY(0);
        await Utils.sleep(topSettleWaitMs);
        await maybeExpand('final');
        const afterCount = capture();
        const afterHeight = getH();
        const mergedDelta = Math.max(0, stats.mergedUpdates - beforeMergedUpdates);
        const countDelta = Math.max(0, afterCount - beforeCount);
        const atTop = getY()<=1;
        if (atTop) stats.topReached = true;

        stats.topSettleNewMessages += countDelta;
        stats.topSettleMergedUpdates += mergedDelta;

        const changed = countDelta > 0 || Math.abs(afterHeight - beforeHeight) > 2 || mergedDelta > 0;
        if (!changed && atTop){
          stats.topSettleStableHits++;
        } else if (atTop){
          stats.topSettleStableHits = 0;
        }

        if (stats.topSettleStableHits >= topSettleStableTarget){
          break;
        }
      }
    }

    // stage: down
    lastCount=-1;
    lastHeight=-1;
    for (let i=0;i<cfg.scrollMax;i++){
      ensure();
      stats.downIterations++;
      emit({stage:'down', message:isJa ? '最新の会話まで読み込んでいます…' : 'Loading toward the latest messages…', iter:i+1, max:cfg.scrollMax, count: messageMap.size});

      const y = getY();
      const step = getViewportH()*0.85;
      scrollToY(y + step);
      await Utils.sleep(cfg.scrollDelay);

      await maybeExpand('down');
      const c = capture();
      const h = getH();

      const atBottom = Math.abs(getH() - getViewportH() - getY()) <= 1;
      if (atBottom) stats.bottomReached=true;

      if (c===lastCount && atBottom) stats.bottomStableHits++;
      else if (atBottom) stats.bottomStableHits = Math.max(0, stats.bottomStableHits-1);
      if (c===lastCount && Math.abs(h-lastHeight)<=2) stats.bottomNoChangeHits++;
      else stats.bottomNoChangeHits = 0;

      lastCount = c;
      lastHeight = h;

      if (stats.bottomReached && stats.bottomStableHits>=stats.stableTarget) break;
      if (stats.downIterations>=minIterationsBeforeEarlyExit && stats.bottomNoChangeHits>=stats.earlyExitStableTarget){
        stats.bottomEarlyExit = true;
        break;
      }
    }

    // stage: final settle
    ensure();
    emit({stage:'final', message:isJa ? '最終確認中…' : 'Running final checks…', count: messageMap.size});
    let finalStableHits = 0;
    let finalNewTotal = 0;
    for (let i=0;i<settleLoops;i++){
      const before = messageMap.size;
      await maybeExpand('final');
      capture();
      await Utils.sleep(finalWaitMs);
      capture();
      const after = messageMap.size;
      const delta = Math.max(0, after-before);
      finalNewTotal += delta;
      if (delta===0) finalStableHits++;
      else finalStableHits = 0;
    }
    stats.finalStableHits = finalStableHits;
    stats.finalNewMessages = finalNewTotal;

    // 元の位置に戻す（UX）
    try{
      scrollToY(initialY);
      if (isRoot) window.scrollTo(0, initialY);
    }catch{}

    const orderedRecords = topoOrderMessages();
    stats.unknownMessages = orderedRecords.filter(m => m.role === 'Unknown').length;
    stats.weakIdentityMessages = orderedRecords.filter(m => !!m.weakIdentity).length;
    const messages = orderedRecords.map(({firstSeenCapture, firstSeenDomIndex, lastSeenCapture, lastSeenDomIndex, weakIdentity, ...m})=>m);
    const quality = this.buildQuality(stats, adapter.getQualityPolicy?.() || {});
    return {messages, quality, containerIsRoot:isRoot};
  }
}

// ---------------- App ----------------
class App{
  constructor(){
    this.adapter = AdapterFactory.getAdapter();
    this.siteId = this.adapter.id;
    this.config = this.loadConfig();
    setRuntimeLang(this.getLang());
    this.abortState = {aborted:false};
    this.busyOverlay = null;
    this.pendingRerunSnapshot = null;
  }

  getLang(){
    return normalizeLangId(this.config?.lang) || getRuntimeLang();
  }

  isJapanese(){
    return this.getLang() === 'ja';
  }

  isChinese(){
    return this.getLang() === 'zh-CN';
  }

  text(jaText, enText, zhText){
    return pickLangText(jaText, enText, zhText, this.getLang());
  }

  numberLocale(){
    if (this.isJapanese()) return 'ja-JP';
    if (this.isChinese()) return 'zh-CN';
    return 'en-US';
  }

  formatNumber(value){
    return Number(value ?? 0).toLocaleString(this.numberLocale());
  }

  formatCount(value){
    if (this.isJapanese()) return `${this.formatNumber(value)}件`;
    if (this.isChinese()) return `${this.formatNumber(value)}条`;
    return `${this.formatNumber(value)}`;
  }

  formatTimes(value){
    if (this.isJapanese()) return `${this.formatNumber(value)}回`;
    if (this.isChinese()) return `${this.formatNumber(value)}次`;
    return `${this.formatNumber(value)} times`;
  }

  formatPoints(value){
    if (this.isJapanese()) return `${this.formatNumber(value)}点`;
    if (this.isChinese()) return `${this.formatNumber(value)}分`;
    return `${this.formatNumber(value)} pts`;
  }

  yesNo(value){
    if (this.isJapanese()) return value ? 'はい' : 'いいえ';
    if (this.isChinese()) return value ? '是' : '否';
    return value ? 'Yes' : 'No';
  }

  getSiteLabel(){
    return this.adapter.id === 'generic'
      ? this.text('汎用', 'Generic', '通用')
      : this.adapter.label;
  }

  languageLabel(lang){
    const resolved = normalizeLangId(lang);
    if (resolved === 'ja') return '日本語';
    if (resolved === 'zh-CN') return '中文';
    return 'English';
  }

  languageDescription(lang){
    const resolved = normalizeLangId(lang) || 'en';
    if (this.isJapanese()){
      if (resolved === 'ja') return '日本語UIと出力ラベル';
      if (resolved === 'zh-CN') return '中国語UIと出力ラベル';
      return '英語UIと出力ラベル';
    }
    if (this.isChinese()){
      if (resolved === 'ja') return '日文界面与导出标签';
      if (resolved === 'zh-CN') return '中文界面与导出标签';
      return '英文界面与导出标签';
    }
    if (resolved === 'ja') return 'Japanese UI and output labels';
    if (resolved === 'zh-CN') return 'Chinese UI and output labels';
    return 'English UI and output labels';
  }

  storageKeys(){
    const scope = `${APP_ID}:${APP_STORAGE_VER}`;
    const legacyScopeV1 = `${APP_ID}:v1`;
    return {
      cfgKey: `${scope}_cfg_${this.siteId}`,
      runMetaKey: `${scope}_run_meta`,
      legacyCfgKeys: [
        `${legacyScopeV1}_cfg_${this.siteId}`,
        `${APP_ID}_cfg_${this.siteId}`
      ],
      legacyRunMetaKeys: [
        `${legacyScopeV1}_run_meta`,
        `${APP_ID}_run_meta`
      ],
    };
  }

  safeJsonGet(key){
    try{
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      const data = JSON.parse(raw);
      return data;
    }catch{
      return null;
    }
  }

  normalizeStoredConfig(raw, def){
    const presets = def.presets;
    const preset = (raw && typeof raw.preset === 'string' && presets[raw.preset]) ? raw.preset : def.preset;
    const merged = {
      ...def,
      lang: normalizeLangId(raw?.lang) || def.lang,
      preset,
      fmt: normalizeFormatId(raw && typeof raw.fmt === 'string' ? raw.fmt : def.fmt),
      txtHeader: typeof raw?.txtHeader === 'boolean' ? raw.txtHeader : def.txtHeader,
      scrollMax: Number.isFinite(raw?.scrollMax) ? raw.scrollMax : undefined,
      scrollDelay: Number.isFinite(raw?.scrollDelay) ? raw.scrollDelay : undefined,
      autoExpand: typeof raw?.autoExpand === 'boolean' ? raw.autoExpand : undefined,
      expandMaxClicks: Number.isFinite(raw?.expandMaxClicks) ? raw.expandMaxClicks : undefined,
      expandClickDelay: Number.isFinite(raw?.expandClickDelay) ? raw.expandClickDelay : undefined
    };
    const presetDefaults = presets[preset] || presets.normal;
    if (!Number.isFinite(merged.scrollMax)) merged.scrollMax = presetDefaults.scrollMax;
    if (!Number.isFinite(merged.scrollDelay)) merged.scrollDelay = presetDefaults.scrollDelay;
    if (typeof merged.autoExpand !== 'boolean') merged.autoExpand = presetDefaults.autoExpand;
    if (!Number.isFinite(merged.expandMaxClicks)) merged.expandMaxClicks = presetDefaults.expandMaxClicks;
    if (!Number.isFinite(merged.expandClickDelay)) merged.expandClickDelay = presetDefaults.expandClickDelay;
    merged.presets = presets;
    return merged;
  }

  getPersistedConfig(){
    return {
      lang: this.getLang(),
      fmt: this.getFormatId(),
      txtHeader: !!this.config.txtHeader,
      preset: this.config.preset,
      scrollMax: this.config.scrollMax,
      scrollDelay: this.config.scrollDelay,
      autoExpand: this.config.autoExpand,
      expandMaxClicks: this.config.expandMaxClicks,
      expandClickDelay: this.config.expandClickDelay
    };
  }

  // ---- config ----
  getDefaultConfig(){
    const presets = {
      fast:    { scrollMax: 10, scrollDelay: 80, autoExpand:false, expandMaxClicks: 0,  expandClickDelay: 100 },
      normal:  { scrollMax: 32, scrollDelay: 220, autoExpand:true,  expandMaxClicks: 24, expandClickDelay: 130 },
      careful: { scrollMax: 96, scrollDelay: 420, autoExpand:true,  expandMaxClicks: 80, expandClickDelay: 150 }
    };
    return {
      lang: detectPreferredLang(),
      fmt:'std', // std|txt|json|obs?
      txtHeader:true,
      preset:'normal',
      presets,
      // 手動調整（詳細設定）
      scrollMax: presets.normal.scrollMax,
      scrollDelay: presets.normal.scrollDelay,
      autoExpand: presets.normal.autoExpand,
      expandMaxClicks: presets.normal.expandMaxClicks,
      expandClickDelay: presets.normal.expandClickDelay
    };
  }

  loadConfig(){
    const {cfgKey, legacyCfgKeys} = this.storageKeys();
    const def = this.getDefaultConfig();
    try{
      const cfgFromNew = this.safeJsonGet(cfgKey);
      const legacyCfg = Array.isArray(legacyCfgKeys)
        ? legacyCfgKeys.map(key => this.safeJsonGet(key)).find(v => v && typeof v === 'object')
        : null;
      const cfg = cfgFromNew || legacyCfg;
      if (!cfg || typeof cfg !== 'object'){
        return def;
      }
      const normalized = this.normalizeStoredConfig(cfg, def);
      if (!cfgFromNew && legacyCfg){
        this.safeSet(cfgKey, {
          lang: normalized.lang,
          fmt: normalized.fmt,
          preset: normalized.preset,
          scrollMax: normalized.scrollMax,
          scrollDelay: normalized.scrollDelay,
          autoExpand: normalized.autoExpand,
          expandMaxClicks: normalized.expandMaxClicks,
          expandClickDelay: normalized.expandClickDelay
        });
        for (const key of legacyCfgKeys || []) this.safeDelete(key);
      }
      return normalized;
    }catch{
      return def;
    }
  }

  saveConfig(){
    const {cfgKey} = this.storageKeys();
    setRuntimeLang(this.getLang());
    this.safeSet(cfgKey, this.getPersistedConfig());
  }

  safeSet(key, value){
    try{ localStorage.setItem(key, JSON.stringify(value)); }catch{}
  }

  safeDelete(key){
    try{ localStorage.removeItem(key); }catch{}
  }

  applyPreset(preset){
    const p = this.config.presets?.[preset];
    if (!p) return;
    this.config.preset = preset;
    this.config.scrollMax = p.scrollMax;
    this.config.scrollDelay = p.scrollDelay;
    this.config.autoExpand = p.autoExpand;
    this.config.expandMaxClicks = p.expandMaxClicks;
    this.config.expandClickDelay = p.expandClickDelay;
  }

  configForRun(presetOverride=null){
    if (!presetOverride || presetOverride===this.config.preset){
      return this.config;
    }
    const presetConfig = this.config.presets?.[presetOverride];
    if (!presetConfig) return this.config;
    return {
      ...this.config,
      preset: presetOverride,
      scrollMax: presetConfig.scrollMax,
      scrollDelay: presetConfig.scrollDelay,
      autoExpand: presetConfig.autoExpand,
      expandMaxClicks: presetConfig.expandMaxClicks,
      expandClickDelay: presetConfig.expandClickDelay
    };
  }

  // ---- run meta (diff) ----
  loadRunMeta(){
    const {runMetaKey, legacyRunMetaKeys} = this.storageKeys();
    const normalizedMeta = (() => {
      const current = this.safeJsonGet(runMetaKey);
      const legacyMerged = {};
      for (const key of legacyRunMetaKeys || []){
        const row = this.safeJsonGet(key);
        if (row && typeof row === 'object'){
          Object.assign(legacyMerged, row);
        }
      }
      const merged = {
        ...legacyMerged,
        ...(current && typeof current === 'object' ? current : {})
      };
      if (Object.keys(legacyMerged).length > 0 && (!current || (typeof current === 'object' && Object.keys(current).length === 0))){
        this.safeSet(runMetaKey, merged);
        for (const key of legacyRunMetaKeys || []) this.safeDelete(key);
      }
      return merged;
    })();
    const key = this.adapter.getConversationKey();
    const raw = normalizedMeta[key] || null;
    const entry = this.normalizeRunMeta(raw);
    return {storageKey: runMetaKey, key, previous: entry.latest_success || null, lastAttempt: entry.last_attempt || null, row: entry, meta: normalizedMeta};
  }

  normalizeRunMeta(raw){
    if (!raw || typeof raw !== 'object') return {latest_success:null, last_attempt:null};
    if (raw.latest_success || raw.last_attempt) return raw;
    if (Number.isFinite(raw.count) || Number.isFinite(raw.message_count) || raw.count === 0){
      return {
        latest_success:{
          count: raw.count ?? raw.message_count ?? 0,
          digest: raw.digest || null,
          at: raw.at || null,
          run_mode: raw.run_mode || null,
          saveState: raw.saveState || null,
          quality_status: raw.quality_status || 'WARN',
          quality_score: raw.quality_score ?? 0,
          message_count: raw.message_count ?? raw.count ?? 0
        },
        last_attempt: null
      };
    }
    return {latest_success:null, last_attempt:null};
  }

  setRunAttemptStatus(status, extra={}){
    const {storageKey, key, meta, row} = this.loadRunMeta();
    const next = row || {latest_success:null,last_attempt:null};
    next.last_attempt = Object.assign({}, next.last_attempt||{}, {
      status,
      ...extra,
      updated_at: Utils.nowIso()
    });
    meta[key] = next;
    try{ localStorage.setItem(storageKey, JSON.stringify(meta)); }catch{}
  }

  markRunAttemptStart(mode){
    const runId = `${Date.now()}_${Math.random().toString(36).slice(2,10)}`;
    this.setRunAttemptStatus('running', {
      run_id: runId,
      mode,
      started_at: Utils.nowIso()
    });
    return runId;
  }

  saveRunMeta(next){
    const {storageKey, key, meta, row} = this.loadRunMeta();
    const base = row || {latest_success:null,last_attempt:null};
    const saved = {
      ...next,
      run_status:'success',
      run_saved_at: Utils.nowIso()
    };
    base.latest_success = saved;
    base.last_attempt = Object.assign({}, base.last_attempt || {}, {
      status:'success',
      finished_at: Utils.nowIso()
    });
    meta[key] = base;
    try{ localStorage.setItem(storageKey, JSON.stringify(meta)); }catch{}
  }

  computeRunDigest(messages){
    const payload = messages
      .map(m=>`${m.role || 'Unknown'}\u0000${Utils.safeText(m.content || '').replace(/\s+/g,' ').trim()}`)
      .join('\u0001');
    return Utils.djb2(`${messages.length}\u0002${payload}`);
  }

  diffInfo(messages, comparisonSnapshot=null){
    const {previous: savedPrevious, lastAttempt} = this.loadRunMeta();
    const nowCount = messages.length;
    const nowDigest = this.computeRunDigest(messages);
    let previous = savedPrevious;
    let previousLabel = this.text('前回', 'Previous', '上一次');
    let comparisonKind = 'saved';

    if (comparisonSnapshot && Array.isArray(comparisonSnapshot.messages)){
      previous = {
        count: comparisonSnapshot.messages.length,
        digest: this.computeRunDigest(comparisonSnapshot.messages)
      };
      previousLabel = this.text('前回結果', 'Previous result', '上一次结果');
      comparisonKind = 'snapshot';
    }

    if (!previous || !Number.isFinite(previous.count)){
      return {previous:null, now:{count:nowCount,digest:nowDigest}, lastAttempt, previousLabel, comparisonKind};
    }
    const diff = nowCount - previous.count;
    const diffAbs = Math.abs(diff);
    const rate = previous.count>0 ? diffAbs/previous.count : 0;
    const stable = diffAbs<=1 || rate<=0.01;
    const digestSame = previous.digest && previous.digest===nowDigest;
    return {previous, now:{count:nowCount,digest:nowDigest}, lastAttempt, diff, diffAbs, rate, stable, digestSame, previousLabel, comparisonKind};
  }

  cloneMessages(messages){
    if (!Array.isArray(messages)) return [];
    return messages.map(m=>({
      role: m?.role || 'Unknown',
      content: String(m?.content || ''),
      sig: m?.sig || null
    }));
  }

  cloneQuality(quality){
    return quality && typeof quality === 'object' ? {...quality} : null;
  }

  createResultSnapshot(messages, quality, extra={}){
    return {
      messages: this.cloneMessages(messages),
      quality: this.cloneQuality(quality),
      preset: extra.preset || this.config.preset,
      createdAt: extra.createdAt || Utils.nowIso()
    };
  }

  getPresetLabelFor(preset){
    if (this.isJapanese()) return preset==='fast'?'はやい' : preset==='careful'?'ていねい' : 'ふつう';
    if (this.isChinese()) return preset==='fast'?'快速' : preset==='careful'?'细致' : '标准';
    return preset==='fast'?'Fast' : preset==='careful'?'Careful' : 'Normal';
  }

  buildResultSnapshotSummaryLines(snapshot){
    if (!snapshot) return [];
    const count = this.formatCount((snapshot.messages || []).length);
    const lines = this.isJapanese()
      ? [
          `会話数: ${count}`,
          `取得モード: ${this.getPresetLabelFor(snapshot.preset)}`
        ]
      : this.isChinese()
      ? [
          `消息数: ${count}`,
          `运行模式: ${this.getPresetLabelFor(snapshot.preset)}`
        ]
      : [
          `Messages: ${count}`,
          `Mode: ${this.getPresetLabelFor(snapshot.preset)}`
        ];
    if (snapshot.quality){
      lines.push(
        this.isJapanese()
          ? `判定: ${snapshot.quality.status || 'WARN'}（${this.formatPoints(snapshot.quality.score ?? 0)}）`
          : this.isChinese()
          ? `状态: ${snapshot.quality.status || 'WARN'}（${this.formatPoints(snapshot.quality.score ?? 0)}）`
          : `Status: ${snapshot.quality.status || 'WARN'} (${this.formatPoints(snapshot.quality.score ?? 0)})`
      );
    }
    return lines;
  }

  async resolveResultDialogChoice(primarySnapshot, alternateSnapshot=null){
    let current = primarySnapshot;
    let alternate = alternateSnapshot;
    for(;;){
      const showingPrimary = current === primarySnapshot;
      const result = await this.showResultDialog(current.messages, current.quality, {
        preset: current?.preset || this.config.preset,
        alternateSnapshot: alternate,
        alternateTitle: showingPrimary
          ? this.text('再実行前の結果を保持中', 'Previous result kept', '已保留重试前的结果')
          : this.text('今回の再取得結果も保持中', 'Current result kept', '也保留了本次重新提取的结果'),
        alternateButtonLabel: showingPrimary
          ? this.text('前回結果を見る', 'View previous result', '查看上一次结果')
          : this.text('今回結果を見る', 'View current result', '查看当前结果')
      });
      if (result?.action==='show_alternate_result' && alternate){
        const previousCurrent = current;
        current = alternate;
        alternate = previousCurrent;
        continue;
      }
      return {result, snapshot: current};
    }
  }

  handleRunDialogResult(result, snapshot, attemptId){
    const selectedSnapshot = snapshot || this.createResultSnapshot([], null, {preset:this.config.preset});
    const selectedMessages = selectedSnapshot.messages || [];
    const selectedQuality = selectedSnapshot.quality || null;
    const selectedDiff = this.diffInfo(selectedMessages);
    const selectedMode = selectedSnapshot.preset || this.config.preset;

    if (result?.action==='done_clipboard' || result?.action==='done_file'){
      this.pendingRerunSnapshot = null;
      this.saveRunMeta({
        count:selectedMessages.length,
        digest:selectedDiff.now.digest,
        at:Utils.nowIso(),
        saveState: result.saveState || result.action,
        run_mode: selectedMode,
        quality_status: selectedQuality?.status || 'WARN',
        quality_score: selectedQuality?.score ?? 0,
        message_count: selectedMessages.length,
        run_id: attemptId
      });
      this.setRunAttemptStatus('success', {attempt_id: attemptId, count: selectedMessages.length, mode: selectedMode});
      return;
    }

    if (result?.action==='rerun_careful'){
      this.pendingRerunSnapshot = this.createResultSnapshot(selectedMessages, selectedQuality, {preset:selectedMode});
      this.setRunAttemptStatus('rerun_requested', {
        attempt_id: attemptId,
        count: selectedMessages.length,
        mode: selectedMode,
        next_action: result.action
      });
      return;
    }

    if (result?.action==='cancel'){
      this.setRunAttemptStatus('cancel', {
        attempt_id: attemptId,
        count: selectedMessages.length,
        mode: selectedMode
      });
      return;
    }

    this.setRunAttemptStatus('aborted', {
      attempt_id: attemptId,
      count: selectedMessages.length,
      mode: selectedMode,
      next_action: result?.action || 'unknown'
    });
  }

  // ---- UI primitives ----
  overlay(){
    return Utils.el('div',{style:`position:fixed;inset:0;z-index:${Z};background:rgba(0,0,0,.82);display:flex;align-items:center;justify-content:center;padding:16px;font:${THEME.font};`});
  }

  btn(label, kind, onClick){
    const styles = {
      primary:`background:${THEME.accent};border:1px solid ${THEME.accent};color:#fff;`,
      secondary:`background:${THEME.surface};border:1px solid ${THEME.border};color:${THEME.fg};`,
      subtle:`background:transparent;border:1px solid ${THEME.border};color:${THEME.fg};`,
      danger:`background:${THEME.bad};border:1px solid ${THEME.bad};color:#fff;`
    };
    const base = `padding:10px 14px;border-radius:12px;font-weight:700;font-size:14px;line-height:1.45;cursor:pointer;transition:.12s;`;
    const b = Utils.el('button',{style:base + (styles[kind]||styles.secondary)});
    b.textContent = label;
    b.addEventListener('mouseenter', ()=>{
      if (kind==='primary') b.style.background = THEME.accentHover;
    });
    b.addEventListener('mouseleave', ()=>{
      if (kind==='primary') b.style.background = THEME.accent;
    });
    b.addEventListener('click', (e)=>{ e.preventDefault(); e.stopPropagation(); onClick?.(); });
    return b;
  }

  chip(title, value, color=THEME.fg){
    return Utils.el('div',{style:`padding:10px 12px;border-radius:12px;border:1px solid ${THEME.border};background:${THEME.bg};`},[
      Utils.el('div',{text:title,style:`font-size:14px;line-height:1.55;color:${THEME.muted};margin-bottom:4px;font-weight:600;`}),
      Utils.el('div',{text:value,style:`font-size:14px;line-height:1.5;font-weight:700;color:${color};word-break:break-word;`})
    ]);
  }

  sectionTitle(t){
    return Utils.el('div',{text:t,style:`font-size:14px;line-height:1.5;font-weight:700;color:${THEME.fg};margin:14px 0 10px;`});
  }

  // ---- dialogs ----
  async showConfigDialog(){
    return new Promise(resolve=>{
      const isJa = this.isJapanese();
      const isZh = this.isChinese();
      const rerender = ()=>{
        ov.remove();
        this.showConfigDialog().then(resolve);
      };
      const ov = this.overlay();
      const modal = Utils.el('div',{style:`width:min(640px, calc(100vw - 32px));background:${THEME.surface};border:1px solid ${THEME.border};border-radius:16px;overflow:hidden;box-shadow:0 10px 28px rgba(0,0,0,.4);color:${THEME.fg};`});

      const header = Utils.el('div',{style:`padding:20px 22px;background:${THEME.bg};border-bottom:1px solid ${THEME.border};`},[
        Utils.el('div',{text:this.text('AIチャットを書き出す', 'Export AI chat', '导出 AI 对话'),style:'font-size:20px;line-height:1.35;font-weight:700;margin-bottom:6px;'}),
        Utils.el('div',{text:this.text(`サイト: ${this.getSiteLabel()}`, `Site: ${this.getSiteLabel()}`, `站点: ${this.getSiteLabel()}`),style:`font-size:14px;line-height:1.6;color:${THEME.muted};font-weight:600;`})
      ]);

      const body = Utils.el('div',{style:'padding:18px 22px;'});
      body.appendChild(this.sectionTitle(this.text('言語', 'Language', '语言')));
      const langWrap = Utils.el('div',{style:'display:flex;gap:10px;flex-wrap:wrap;'});
      const langBtn = (lang)=>{
        const active = this.getLang()===lang;
        const btn = Utils.el('button',{style:`padding:11px 12px;border-radius:12px;border:1px solid ${active?THEME.accentLine:THEME.border};background:${active?'rgba(95,162,255,0.14)':THEME.bg};color:${THEME.fg};cursor:pointer;`});
        btn.append(
          Utils.el('div',{text:this.languageLabel(lang),style:'font-weight:700;font-size:14px;line-height:1.45;'}),
          Utils.el('div',{text:this.languageDescription(lang),style:`margin-top:4px;font-size:14px;line-height:1.6;color:${THEME.muted};font-weight:500;`})
        );
        btn.addEventListener('click', ()=>{
          this.config.lang = lang;
          this.saveConfig();
          rerender();
        });
        return btn;
      };
      langWrap.append(langBtn('en'), langBtn('ja'), langBtn('zh-CN'));
      body.appendChild(langWrap);

      body.appendChild(this.sectionTitle(this.text('速度プリセット', 'Mode', '运行模式')));
      const presetWrap = Utils.el('div',{style:'display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;'});
      const presetCard = (id, title, desc)=>{
        const active = this.config.preset===id;
        const card = Utils.el('button',{style:`text-align:left;padding:13px;border-radius:14px;border:1px solid ${active?THEME.accentLine:THEME.border};background:${active?'rgba(95,162,255,0.14)':THEME.bg};color:${THEME.fg};cursor:pointer;`});
        card.append(
          Utils.el('div',{text:title,style:'font-weight:700;font-size:14px;line-height:1.5;margin-bottom:4px;'}),
          Utils.el('div',{text:desc,style:`font-size:14px;line-height:1.65;color:${THEME.muted};font-weight:500;`})
        );
        card.addEventListener('click', ()=>{
          this.applyPreset(id);
          this.saveConfig();
          rerender();
        });
        return card;
      };
      presetWrap.append(
        presetCard('fast',this.getPresetLabelFor('fast'),this.text('短い会話向き。最速・展開なし', 'Best for short chats. No expansion.', '适合短对话。最快，不展开内容。')),
        presetCard('normal',this.getPresetLabelFor('normal'),this.text('既定。普段使い向け', 'Default. Good for most chats.', '默认。适合大多数对话。')),
        presetCard('careful',this.getPresetLabelFor('careful'),this.text('長い会話向き。先頭追い込みあり', 'Best for long chats. Scrolls more to reach the top.', '适合长对话。会更多滚动以到达顶部。'))
      );
      body.appendChild(presetWrap);

      // チェック：自動展開
      const expandRow = Utils.el('div',{style:`margin-top:14px;padding:12px;border-radius:14px;border:1px solid ${THEME.border};background:${THEME.bg};display:flex;gap:10px;align-items:flex-start;`});
      const cb = Utils.el('input',{type:'checkbox',style:'margin-top:3px;'});
      cb.checked = !!this.config.autoExpand;
      cb.addEventListener('change', ()=>{ this.config.autoExpand=cb.checked; this.saveConfig(); });
      expandRow.append(
        cb,
        Utils.el('div',{},[
          Utils.el('div',{text:this.text('本文の「続きを読む」等を自動で開く', 'Auto-expand “Show more” buttons', '自动展开“显示更多”等按钮'),style:'font-weight:700;font-size:14px;line-height:1.5;margin-bottom:4px;'}),
          Utils.el('div',{text:this.text('漏れ対策に効きます。誤爆しないよう安全側に制限しています。', 'Helps avoid missing content. Uses safe clicks to avoid mistakes.', '有助于减少漏抓内容。会尽量使用更安全的点击方式。'),style:`font-size:14px;line-height:1.65;color:${THEME.muted};font-weight:500;`})
        ])
      );
      body.appendChild(expandRow);

      // 形式
      body.appendChild(this.sectionTitle(this.text('保存形式', 'Save format', '保存格式')));
      const fmtWrap = Utils.el('div',{style:'display:flex;gap:10px;flex-wrap:wrap;'});
      const fmtBtn = (id, def)=>{
        const active = this.getFormatId()===id;
        const b = Utils.el('button',{style:`padding:11px 12px;border-radius:12px;border:1px solid ${active?THEME.accentLine:THEME.border};background:${active?'rgba(95,162,255,0.14)':THEME.bg};color:${THEME.fg};cursor:pointer;`});
        b.append(Utils.el('div',{text:def.label,style:'font-weight:700;font-size:14px;line-height:1.45;'}),
                 Utils.el('div',{text:def.hint,style:`margin-top:4px;font-size:14px;line-height:1.6;color:${THEME.muted};font-weight:500;`}));
        b.addEventListener('click', ()=>{ this.config.fmt=id; this.saveConfig(); rerender(); });
        return b;
      };
      for (const id of FORMAT_ORDER){
        fmtWrap.append(fmtBtn(id, this.getFormatDefFor(id)));
      }
      body.appendChild(fmtWrap);

      if (this.getFormatId()==='txt'){
        const txtRow = Utils.el('div',{style:`margin-top:14px;padding:12px;border-radius:14px;border:1px solid ${THEME.border};background:${THEME.bg};display:flex;gap:10px;align-items:flex-start;`});
        const txtHeaderCb = Utils.el('input',{type:'checkbox',style:'margin-top:3px;'});
        txtHeaderCb.checked = !!this.config.txtHeader;
        txtHeaderCb.addEventListener('change', ()=>{
          this.config.txtHeader = txtHeaderCb.checked;
          this.saveConfig();
        });
        txtRow.append(
          txtHeaderCb,
          Utils.el('div',{},[
            Utils.el('div',{text:this.text('会話ヘッダーを付ける', 'Include conversation header', '包含对话头部信息'),style:'font-weight:700;font-size:14px;line-height:1.5;margin-bottom:4px;'}),
            Utils.el('div',{text:this.text('タイトル、保存日時、URL、品質判定を先頭に入れます。本文だけ欲しい場合は外してください。', 'Adds the title, time, URL, and quality summary above the text. Turn this off if you want only the conversation text.', '会在正文前加入标题、保存时间、URL 和质量状态。如果只想保留正文，请关闭。'),style:`font-size:14px;line-height:1.65;color:${THEME.muted};font-weight:500;`})
          ])
        );
        body.appendChild(txtRow);
      }

      // 詳細
      const details = Utils.el('details',{style:`margin-top:14px;border:1px solid ${THEME.border};border-radius:14px;background:${THEME.bg};overflow:hidden;`});
      const sum = Utils.el('summary',{text:this.text('細かく調整する', 'Advanced settings', '高级设置'),style:`cursor:pointer;list-style:none;padding:12px 14px;font-weight:700;font-size:14px;line-height:1.5;`});
      const inner = Utils.el('div',{style:'padding:12px 14px;border-top:1px solid '+THEME.border+';display:grid;gap:10px;'});
      const slider = (label, key, min, max, step, unit)=>{
        const row = Utils.el('div',{style:'display:grid;grid-template-columns:1fr auto;gap:10px;align-items:center;'});
        const left = Utils.el('div',{},[
          Utils.el('div',{text:label,style:'font-weight:700;font-size:14px;line-height:1.5;'}),
          Utils.el('div',{text:this.text(`現在: ${this.config[key]}${unit}`, `Current: ${this.config[key]}${unit}`, `当前: ${this.config[key]}${unit}`),style:`font-size:14px;line-height:1.6;color:${THEME.muted};margin-top:2px;font-weight:500;`})
        ]);
        const input = Utils.el('input',{type:'range',min:String(min),max:String(max),step:String(step),value:String(this.config[key]),style:'width:220px;'});
        input.addEventListener('input', ()=>{
          this.config[key]=Number(input.value);
          this.saveConfig();
          left.querySelectorAll('div')[1].textContent = this.text(`現在: ${this.config[key]}${unit}`, `Current: ${this.config[key]}${unit}`, `当前: ${this.config[key]}${unit}`);
        });
        row.append(left, input);
        return row;
      };
      inner.append(
        slider(this.text('各方向の最大スクロール回数', 'Max scroll rounds per direction', '每个方向的最大滚动轮数'),'scrollMax', 10, 220, 2, isJa ? '回' : isZh ? '轮' : ''),
        slider(this.text('待ち時間', 'Delay between rounds', '每轮之间的等待时间'),'scrollDelay', 120, 1200, 20, 'ms'),
        slider(this.text('展開クリック上限', 'Max auto-expands', '自动展开上限'),'expandMaxClicks', 0, 600, 10, isJa ? '回' : isZh ? '次' : ''),
        slider(this.text('展開クリック間隔', 'Auto-expand interval', '自动展开间隔'),'expandClickDelay', 80, 600, 10, 'ms'),
        Utils.el('div',{text:this.text('※ プリセットを選ぶと、ここは上書きされます（必要なら再調整してください）。', '* Choosing a preset overwrites these values. Adjust again afterward if needed.', '选择预设后，这些值会被覆盖。需要的话请再调整。'),style:`font-size:14px;line-height:1.65;color:${THEME.muted};font-weight:500;`})
      );
      details.append(sum, inner);
      body.appendChild(details);

      const footer = Utils.el('div',{style:`padding:16px 22px;background:${THEME.bg};border-top:1px solid ${THEME.border};display:flex;gap:10px;justify-content:flex-end;flex-wrap:wrap;`});
      footer.append(
        this.btn(this.text('キャンセル', 'Cancel', '取消'),'subtle', ()=>{ ov.remove(); resolve(false); }),
        this.btn(this.text('開始', 'Start', '开始'),'primary', ()=>{ ov.remove(); resolve(true); })
      );

      modal.append(header, body, footer);
      ov.appendChild(modal);
      document.body.appendChild(ov);
    });
  }

  showBusyDialog(){
    const isJa = this.isJapanese();
    const ov = this.overlay();
    const modal = Utils.el('div',{style:`width:min(520px, calc(100vw - 32px));background:${THEME.surface};border:1px solid ${THEME.border};border-radius:16px;overflow:hidden;box-shadow:0 10px 28px rgba(0,0,0,.4);color:${THEME.fg};`});
    const header = Utils.el('div',{style:`padding:18px 20px;background:${THEME.bg};border-bottom:1px solid ${THEME.border};`});
    const title = Utils.el('div',{text:isJa ? '準備しています' : 'Preparing',style:'font-size:19px;line-height:1.4;font-weight:700;margin-bottom:6px;'});
    const desc = Utils.el('div',{text:isJa ? 'ページをスクロールして会話を集めています…' : 'Scrolling through the page and collecting messages…',style:`font-size:14px;line-height:1.65;color:${THEME.muted};font-weight:500;`});
    header.append(title, desc);

    const body = Utils.el('div',{style:'padding:16px 20px;'});
    const barWrap = Utils.el('div',{style:`height:10px;border-radius:999px;background:${THEME.bg};border:1px solid ${THEME.border};overflow:hidden;`});
    const bar = Utils.el('div',{style:`height:100%;width:15%;background:${THEME.accent};border-radius:999px;transition:width .12s;`});
    barWrap.appendChild(bar);
    const info = Utils.el('div',{style:`margin-top:10px;font-size:14px;line-height:1.65;color:${THEME.muted};font-weight:500;`});
    body.append(barWrap, info);

    const footer = Utils.el('div',{style:`padding:14px 20px;background:${THEME.bg};border-top:1px solid ${THEME.border};display:flex;justify-content:flex-end;`});
    footer.append(this.btn(isJa ? '中断' : 'Abort','danger', ()=>{ this.abortState.aborted=true; Utils.toast(isJa ? '中断しました。' : 'Aborted.', 'warn'); }));

    modal.append(header, body, footer);
    ov.appendChild(modal);
    document.body.appendChild(ov);

    this.busyOverlay = ov;
    this.busyUI = {title, desc, bar, info};
  }

  updateBusyDialog(p){
    if (!this.busyUI) return;
    const stage = p?.stage || '';
    const isJa = this.isJapanese();
    const stageTitle = stage==='prepare' ? (isJa ? '準備しています' : 'Preparing')
      : stage==='top' ? (isJa ? '古い会話を読み込んでいます' : 'Loading older messages')
      : stage==='down' ? (isJa ? '最新の会話まで読み込んでいます' : 'Loading toward the latest messages')
      : stage==='expand' ? (isJa ? '本文を展開しています' : 'Expanding collapsed content')
      : stage==='final' ? (isJa ? '最終確認中' : 'Final checks')
      : (isJa ? '処理中' : 'Processing');
    this.busyUI.title.textContent = stageTitle;
    if (p?.message) this.busyUI.desc.textContent = p.message;

    const iter = Number.isFinite(p?.iter) ? p.iter : null;
    const max = Number.isFinite(p?.max) ? p.max : null;
    let pct = 18;
    if (iter!=null && max!=null && max>0){
      pct = Utils.clamp(Math.round((iter/max)*100), 5, 95);
      // top/down両方あるので、ざっくり段階を足す
      if (stage==='down') pct = Utils.clamp(50 + Math.round((iter/max)*50), 50, 98);
      if (stage==='top') pct = Utils.clamp(Math.round((iter/max)*50), 5, 50);
    } else if (stage==='final') pct = 99;
    this.busyUI.bar.style.width = `${pct}%`;

    const c = Number.isFinite(p?.count) ? p.count : null;
    const parts=[];
    if (c!=null) parts.push(isJa ? `見つかった会話: ${this.formatCount(c)}` : `Messages found: ${this.formatNumber(c)}`);
    if (iter!=null && max!=null) parts.push(isJa ? `進行: ${iter}/${max}` : `Progress: ${iter}/${max}`);
    this.busyUI.info.textContent = parts.join(' / ');
  }

  closeBusyDialog(){
    try{ this.busyOverlay?.remove(); }catch{}
    this.busyOverlay=null;
    this.busyUI=null;
  }

  qualityStatusText(status, compact=false){
    if (this.isJapanese()){
      if (status==='PASS') return '良好';
      if (status==='WARN') return compact ? '注意' : 'やや不安';
      return compact ? '再実行' : '要再実行';
    }
    if (this.isChinese()){
      if (status==='PASS') return '良好';
      if (status==='WARN') return compact ? '快速检查' : '需要快速检查';
      return compact ? '建议重试' : '建议重新运行';
    }
    if (status==='PASS') return compact ? 'Good' : 'Looks good';
    if (status==='WARN') return compact ? 'Review' : 'Needs a quick check';
    return compact ? 'Rerun' : 'Rerun recommended';
  }

  qualityHintText(status, compact=false){
    if (status==='PASS'){
      return this.isJapanese()
        ? (compact ? '保存できそうです。' : '概ね問題なさそうです。')
        : this.isChinese()
        ? (compact ? '可保存。' : '看起来可以保存。')
        : (compact ? 'Ready to save.' : 'The result looks stable enough to save.');
    }
    if (status==='WARN'){
      return this.isJapanese()
        ? (compact ? '必要なら再実行。' : '会話が長い場合は、もう一度実行すると安定することがあります。')
        : this.isChinese()
        ? (compact ? '较长时可重试一次。' : '如果聊天很长，重新运行一次可能会更稳定。')
        : (compact ? 'Rerun if needed.' : 'If the chat is long, rerunning once may improve stability.');
    }
    return this.isJapanese()
      ? (compact ? '再実行推奨です。' : '取得漏れの可能性が高いです。もう一度実行を推奨します。')
      : this.isChinese()
      ? (compact ? '可能缺失，建议重试。' : '可能有内容缺失。建议保存前重新运行。')
      : (compact ? 'Rerun recommended.' : 'Missing content is likely. Rerun before saving.');
  }

  largeDeltaHintText(compact=false){
    if (this.isJapanese()) return '前回との差が大きいです。';
    if (this.isChinese()) return compact ? '与上次差异大。' : '与上一次的差异较大，滚动可能过早停止了。';
    return compact ? 'Large delta from previous.' : 'The difference from the previous result is large. Scrolling may have stopped early.';
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
      copy_failed_save: this.text('コピー失敗のため、ファイル保存に切り替えます。', 'Clipboard copy failed, switching to file save.', '复制失败，改为保存文件。'),
      manual_copy_prompt: this.text('コピー失敗。ここから手動でコピーしてください。', 'Copy failed. Copy here.', '复制失败。请从这里手动复制。'),
      copy_save_failed: this.text('コピーも保存も失敗しました。', 'Copy/save failed.', '复制和保存都失败。')
    };
    return table[key] || '';
  }

  qualitySummary(quality, diff){
    // qualityが無いケースもある
    const q = quality || {status:'WARN', score:0};
    const label = this.qualityStatusText(q.status, false);
    const color = q.status==='PASS'?THEME.ok : q.status==='WARN'?THEME.warn : THEME.bad;
    let hint = this.qualityHintText(q.status, false);

    if ((q.weakIdentityMessages||0) > 0 && !q.identityStable){
      hint = this.isJapanese()
        ? '一部メッセージの識別が弱く、重複や順序の精度が落ちる可能性があります。'
        : this.isChinese()
        ? '部分消息的识别较弱，去重和顺序可能不够稳定。'
        : 'Some message identities are weak, so dedupe and ordering may be less reliable.';
    } else if ((q.unknownMessages||0) > 0){
      hint = this.isJapanese()
        ? '一部メッセージの話者判定が不明です。DOM変更の影響を受けている可能性があります。'
        : this.isChinese()
        ? '部分说话者标签无法确定，可能受到了 DOM 变化的影响。'
        : 'Some speaker labels are unknown. A DOM change may have affected extraction.';
    }

    // diffによる追加ヒント
    let diffLine = '';
    const abortedLast = diff?.lastAttempt?.status==='aborted' || diff?.lastAttempt?.status==='cancel';
    if (diff?.previous){
      const sign = diff.diff>0?'+':'';
      diffLine = this.isJapanese()
        ? `${diff.previousLabel || '前回'}: ${this.formatCount(diff.previous.count)} / 今回: ${this.formatCount(diff.now.count)}（差分 ${sign}${this.formatCount(diff.diff)}）`
        : this.isChinese()
        ? `${diff.previousLabel || '上一次'}: ${this.formatCount(diff.previous.count)} / 本次: ${this.formatCount(diff.now.count)}（差值 ${sign}${this.formatCount(diff.diff)}）`
        : `${diff.previousLabel || 'Previous'}: ${this.formatNumber(diff.previous.count)} / Current: ${this.formatNumber(diff.now.count)} (delta ${sign}${this.formatNumber(diff.diff)})`;
      if (!diff.stable && diff.rate>=0.12){
        hint = this.largeDeltaHintText(false);
      } else if (diff.digestSame){
        hint = this.isJapanese()
          ? '前回とほぼ同じ内容です（安定）。'
          : this.isChinese()
          ? '这次和上一次几乎相同。'
          : 'This is almost identical to the previous result.';
      }
    }

    if (!diff?.previous && abortedLast){
      diffLine = this.isJapanese()
        ? '前回: 保存なし（中断）。今回は新規再取得で比較基準はリセットされます。'
        : this.isChinese()
        ? '上一次: 未保存（已中断）。这次重新提取后，比较基准会重置。'
        : 'Previous: not saved (aborted). The comparison base was reset for this fresh rerun.';
      hint = this.isJapanese()
        ? '前回は保存されていないため、今回は保存結果を基準に比較します。'
        : this.isChinese()
        ? '上一次没有保存，所以之后会以这次保存结果作为比较基准。'
        : 'The previous run was not saved, so future comparisons will use this saved result.';
    }
    return {label, color, hint, diffLine, score:q.score, raw:q};
  }

  getPresetLabel(){
    return this.getPresetLabelFor(this.config.preset);
  }
  getFormatId(){
    return normalizeFormatId(this.config.fmt);
  }
  getFormatDefFor(id){
    const lang = this.getLang();
    const normalizedId = normalizeFormatId(id);
    const def = FORMAT_DEFS[normalizedId];
    const text = FORMAT_TEXT[normalizedId] || FORMAT_TEXT.std;
    return {
      ...def,
      label: text?.label?.[lang] || text?.label?.en || 'Markdown',
      hint: text?.hint?.[lang] || text?.hint?.en || ''
    };
  }
  getFormatDef(){
    return this.getFormatDefFor(this.getFormatId());
  }
  getFormatLabel(){
    return this.getFormatDef().label;
  }
  isTxtHeaderEnabled(){
    return this.getFormatId()==='txt' && !!this.config.txtHeader;
  }

  roleLabel(role){
    if (role==='User') return this.isJapanese() ? 'あなた' : this.isChinese() ? '你' : 'You';
    if (role==='Model') return 'AI';
    if (role==='Tool') return this.isJapanese() ? 'ツール' : this.isChinese() ? '工具' : 'Tool';
    return this.isJapanese() ? '不明' : this.isChinese() ? '未知' : 'Unknown';
  }

  yamlValue(v){
    if (typeof v==='number' || typeof v==='boolean') return String(v);
    const s = (v===undefined || v===null) ? '' : String(v);
    return `"${s.replace(/\\/g,'\\\\').replace(/\"/g,'\\\"').replace(/\r/g,'\\r').replace(/\n/g,'\\n').replace(/\t/g,'\\t')}"`;
  }

  buildExportMetadata(title, messages, quality, diff, preset=this.config.preset){
    const warning = this.warningSummary({quality, diff});
    return {
      title: title,
      site: this.getSiteLabel(),
      conversation_url: location.href,
      saved_at: Utils.formatDateJST(new Date()),
      message_count: messages.length,
      preset,
      format: this.getFormatId(),
      quality_status: quality?.status || 'WARN',
      quality_score: quality?.score ?? 0,
      warning: warning.hasWarning,
      warning_text: warning.text,
      previous_count: diff?.previous?.count,
      merged_updates: quality?.mergedUpdates ?? 0,
      unknown_messages: quality?.unknownMessages ?? 0,
      weak_identity_messages: quality?.weakIdentityMessages ?? 0
    };
  }

  dumpYaml(obj){
    return ['---',
      ...Object.entries(obj).map(([k,v])=>`${k}: ${this.yamlValue(v)}`),
      '---',
      ''
    ].join('\n');
  }

  warningSummary({quality, diff}){
    const q = quality || {status:'WARN',score:0};
    const qWarn = q.status!=='PASS';
    const diffWarn = !!(diff?.previous && (!diff.stable && (diff.rate||0) >= 0.12));
    const hasWarning = qWarn || diffWarn;
    const parts = [];
    if (!diff?.previous && (diff?.lastAttempt?.status==='aborted' || diff?.lastAttempt?.status==='cancel')){
      parts.push(this.text('前回は保存されず中断', 'previous run aborted before saving', '上一次运行在保存前中断'));
    } else if (!diff?.previous){
      parts.push(this.text('前回データなし', 'no previous data', '没有上一次数据'));
    }
    if (qWarn){
      const statusText = this.qualityStatusText(q.status, false);
      parts.push(this.isJapanese() || this.isChinese() ? statusText : statusText.toLowerCase());
    }
    if (diffWarn){
      parts.push(this.largeDeltaLabelText());
    }
    const text = hasWarning
      ? Array.from(new Set(parts)).join(' / ')
      : this.text('なし', 'none', '无');
    return {hasWarning, text};
  }

  compactSummaryLines(messages, quality, diff, savedState='未保存'){
    const qWarn = this.warningSummary({quality, diff});
    const warningTail = qWarn.hasWarning && qWarn.text
      ? (this.isJapanese() ? `（${qWarn.text}）` : ` (${qWarn.text})`)
      : '';
    return this.isJapanese()
      ? [
          `抽出件数: ${this.formatCount(messages.length)}`,
          `保存状態: ${savedState}`,
          `警告有無: ${qWarn.hasWarning?'あり':'なし'}${warningTail}`
        ]
      : this.isChinese()
      ? [
          `已提取: ${this.formatCount(messages.length)}`,
          `保存状态: ${savedState}`,
          `警告: ${qWarn.hasWarning?'有':'无'}${warningTail}`
        ]
      : [
          `Extracted: ${this.formatNumber(messages.length)} messages`,
          `Save state: ${savedState}`,
          `Warnings: ${qWarn.hasWarning?'yes':'no'}${warningTail}`
        ];
  }

  lastAttemptStatusLabel(){
    const {previous, lastAttempt} = this.loadRunMeta();
    const status = lastAttempt?.status;
    const map = this.isJapanese()
      ? {
          success: '保存済み（成功）',
          failed: '保存せず失敗',
          aborted: '未保存で中断',
          cancel: '未保存で中止',
          rerun_requested: '再実行要求があった状態',
          running: '実行中（前回保存を参照）'
        }
      : {
          success: 'saved successfully',
          failed: 'failed without saving',
          aborted: 'aborted without saving',
          cancel: 'canceled without saving',
          rerun_requested: 'rerun requested',
          running: 'running (referencing previous save)'
        };
    const previousCount = Number.isFinite(previous?.count)
      ? (this.isJapanese() ? this.formatCount(previous.count) : this.formatNumber(previous.count))
      : (this.isJapanese() ? 'なし' : 'none');
    if (!status) return this.isJapanese() ? `最終保存: ${previousCount}` : `Last saved: ${previousCount}`;
    if (status === 'running') return this.isJapanese() ? `最終保存: ${previousCount}` : `Last saved: ${previousCount}`;
    const suffix = map[status] || (this.isJapanese() ? `状態:${status}` : `status: ${status}`);
    const c = Number.isFinite(lastAttempt.count)
      ? (this.isJapanese() ? `（${this.formatCount(lastAttempt.count)}）` : ` (${this.formatNumber(lastAttempt.count)})`)
      : '';
    return this.isJapanese() ? `直近試行: ${suffix}${c}` : `Latest attempt: ${suffix}${c}`;
  }

  comparisonBaseLabel(diff){
    if (Number.isFinite(diff?.previous?.count)){
      if (diff?.comparisonKind === 'snapshot'){
        const label = diff.previousLabel || this.text('前回結果', 'Previous result', '上一次结果');
        if (this.isJapanese()) return `比較ベース: ${label}（${this.formatCount(diff.previous.count)}）`;
        if (this.isChinese()) return `比较基准: ${label}（${this.formatCount(diff.previous.count)}）`;
        return `Comparison base: ${label} (${this.formatNumber(diff.previous.count)})`;
      }
      return this.isJapanese()
        ? `比較ベース: ${this.formatCount(diff.previous.count)}`
        : this.isChinese()
        ? `比较基准: ${this.formatCount(diff.previous.count)}`
        : `Comparison base: ${this.formatNumber(diff.previous.count)}`;
    }
    return this.isJapanese()
      ? '比較ベース: なし（保存済みなし）'
      : this.isChinese()
      ? '比较基准: 无（没有已保存结果）'
      : 'Comparison base: none (no saved result)';
  }

  async confirmRerunDialog(mode='careful'){
    const modeLabel = this.getPresetLabelFor(mode);
    const title = this.isJapanese() ? 'ていねいに再実行の確認' : 'Confirm careful rerun';
    const actionLabel = this.isJapanese() ? 'ていねいに再実行する' : 'Run again carefully';
    return new Promise(resolve=>{
      const ov = this.overlay();
      const modal = Utils.el('div',{style:`width:min(640px, calc(100vw - 32px));background:${THEME.surface};border:1px solid ${THEME.border};border-radius:16px;overflow:hidden;box-shadow:0 10px 28px rgba(0,0,0,.4);color:${THEME.fg};`});
      const header = Utils.el('div',{style:`padding:20px 22px;background:${THEME.bg};border-bottom:1px solid ${THEME.border};`},[
        Utils.el('div',{text:title,style:'font-size:20px;line-height:1.35;font-weight:700;margin-bottom:6px;'}),
        Utils.el('div',{text:this.isJapanese() ? 'この操作は、今出ている抽出結果を保持したまま先頭から再取得します。' : 'This keeps the current result and reruns the extraction from the top.',style:`font-size:14px;line-height:1.6;color:${THEME.fg};font-weight:700;`}),
        Utils.el('div',{text:this.isJapanese() ? '再取得後に今回結果と前回結果を見比べて選べます。' : 'After rerunning, you can compare the new result with the previous one and choose either.',style:`margin-top:6px;font-size:13px;line-height:1.6;color:${THEME.muted};font-weight:500;`})
      ]);

      const body = Utils.el('div',{style:'padding:18px 22px;display:grid;gap:10px;font-size:14px;line-height:1.6;color:'+THEME.fg+';'});
      const attemptLine = this.lastAttemptStatusLabel();
      const lines = this.isJapanese()
        ? [
            attemptLine,
            `再実行モード: ${modeLabel}`,
            '件数・進捗は0件から再計測',
            '保存ファイルは残り、中間保存状態は上書きされます'
          ]
        : [
            attemptLine,
            `Rerun mode: ${modeLabel}`,
            'Message counts and progress restart from zero.',
            'Saved files remain, but the intermediate saved state is overwritten.'
          ];
      for (const line of lines){
        body.appendChild(Utils.el('div',{text:line,style:'color:'+THEME.fg+';'}));
      }

      const footer = Utils.el('div',{style:`padding:14px 22px;background:${THEME.bg};border-top:1px solid ${THEME.border};display:flex;gap:10px;justify-content:flex-end;`});
      const done=(ok)=>{
        try{ ov.remove(); }catch{}
        document.removeEventListener('keydown', onKeydown);
        resolve(!!ok);
      };
      const confirmBtn = this.btn(actionLabel,'primary', ()=>done(true));
      const cancelBtn = this.btn(this.isJapanese() ? 'やめる' : 'Cancel','subtle', ()=>done(false));
      const onKeydown=(e)=>{
        if (e.key==='Escape'){
          e.preventDefault();
          done(false);
        }else if (e.key==='Enter'){
          e.preventDefault();
          done(true);
        }
      };
      document.addEventListener('keydown', onKeydown);
      footer.append(
        cancelBtn,
        confirmBtn
      );

      modal.append(header, body, footer);
      ov.appendChild(modal);
      document.body.appendChild(ov);
      confirmBtn.focus();
      confirmBtn.style.outline = '2px solid '+THEME.accent;
    });
  }

  makeFileName(title){
    const base = Utils.filenameSafe(title);
    const d = new Date();
    const pad=n=>String(n).padStart(2,'0');
    const stamp = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}`;
    return `${stamp}_${base}.${this.getFormatDef().ext}`;
  }

  normalizeDownloadFileName(raw, fallback){
    const ext = `.${this.getFormatDef().ext}`;
    const base = String(raw || '').trim().replace(/[\\/:*?"<>|]+/g,'_');
    const safe = base || fallback;
    return /\.[a-z0-9]+$/i.test(safe) ? safe : `${safe}${ext}`;
  }

  formatByteSize(bytes){
    const n = Number(bytes) || 0;
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
    return `${(n / (1024 * 1024)).toFixed(2)} MB`;
  }

  buildQualityDetailText(quality){
    const lines = this.isJapanese()
      ? [
          `総合判定: ${quality.status}（${this.formatPoints(quality.score)}）`,
          '',
          `上端まで到達: ${this.yesNo(quality.topReached)}`,
          `上端で安定した回数: ${this.formatTimes(quality.topStableHits)}`,
          `上端の実効安定: ${this.formatTimes(quality.topStableEffectiveHits || quality.topStableHits || 0)}`,
          `上方向で変化が止まった回数: ${this.formatTimes(quality.topNoChangeHits || 0)}`,
          `上方向の早期終了: ${this.yesNo(!!quality.topEarlyExit)}`,
          `追い込み回数: ${this.formatTimes(quality.topSettleIterations || 0)}`,
          `追い込み安定: ${this.formatTimes(quality.topSettleStableHits || 0)}`,
          `追い込み追加会話: ${this.formatCount(quality.topSettleNewMessages || 0)}`,
          `追い込み統合数: ${this.formatCount(quality.topSettleMergedUpdates || 0)}`,
          '',
          `下端まで到達: ${this.yesNo(quality.bottomReached)}`,
          `下端で安定した回数: ${this.formatTimes(quality.bottomStableHits)}`,
          `下方向で変化が止まった回数: ${this.formatTimes(quality.bottomNoChangeHits || 0)}`,
          `下方向の早期終了: ${this.yesNo(!!quality.bottomEarlyExit)}`,
          '',
          `最終確認で増えた新規メッセージ: ${this.formatCount(quality.finalNewMessages)}`,
          `自動で本文展開した回数: ${this.formatTimes(quality.expandClicks)}`,
          `後から内容が伸びて統合した件数: ${this.formatCount(quality.mergedUpdates || 0)}`,
          `話者を判定できなかった件数: ${this.formatCount(quality.unknownMessages || 0)}`,
          `重複判定が弱いメッセージ件数: ${this.formatCount(quality.weakIdentityMessages || 0)}`,
          `順序矛盾の検出数: ${this.formatCount(quality.orderGraphCycles || 0)}`
        ]
      : [
          `Overall: ${quality.status} (${this.formatPoints(quality.score)})`,
          '',
          `Reached top: ${this.yesNo(quality.topReached)}`,
          `Top stable hits: ${this.formatTimes(quality.topStableHits)}`,
          `Effective top stable hits: ${this.formatTimes(quality.topStableEffectiveHits || quality.topStableHits || 0)}`,
          `Top no-change hits: ${this.formatTimes(quality.topNoChangeHits || 0)}`,
          `Top early exit: ${this.yesNo(!!quality.topEarlyExit)}`,
          `Top settle rounds: ${this.formatTimes(quality.topSettleIterations || 0)}`,
          `Top settle stable hits: ${this.formatTimes(quality.topSettleStableHits || 0)}`,
          `Top settle new messages: ${this.formatNumber(quality.topSettleNewMessages || 0)}`,
          `Top settle merged updates: ${this.formatNumber(quality.topSettleMergedUpdates || 0)}`,
          '',
          `Reached bottom: ${this.yesNo(quality.bottomReached)}`,
          `Bottom stable hits: ${this.formatTimes(quality.bottomStableHits)}`,
          `Bottom no-change hits: ${this.formatTimes(quality.bottomNoChangeHits || 0)}`,
          `Bottom early exit: ${this.yesNo(!!quality.bottomEarlyExit)}`,
          '',
          `Final new messages: ${this.formatNumber(quality.finalNewMessages)}`,
          `Auto-expands: ${this.formatTimes(quality.expandClicks)}`,
          `Merged updates: ${this.formatNumber(quality.mergedUpdates || 0)}`,
          `Unknown speakers: ${this.formatNumber(quality.unknownMessages || 0)}`,
          `Weak identity messages: ${this.formatNumber(quality.weakIdentityMessages || 0)}`,
          `Order graph cycles: ${this.formatNumber(quality.orderGraphCycles || 0)}`
        ];
    return lines.join('\n');
  }

  buildQualityUserSummaryLines(quality){
    const lines = [];
    const overall = this.isJapanese()
      ? (quality.status==='PASS'
          ? '保存してよさそうです。'
          : quality.status==='WARN'
            ? '保存はできますが、気になる場合は再実行をおすすめします。'
            : '再実行してから保存したほうが安全です。')
      : (quality.status==='PASS'
          ? 'This looks safe to save.'
          : quality.status==='WARN'
            ? 'You can save it, but rerunning is worth considering.'
            : 'Rerun before saving.');
    lines.push(this.isJapanese() ? `見立て: ${overall}` : `Summary: ${overall}`);

    if (quality.topReached){
      lines.push(this.isJapanese() ? '上側: 先頭まで確認済み。' : 'Top: confirmed to the beginning.');
    } else if (quality.topEarlyExit){
      lines.push(this.isJapanese() ? '上側: 途中で変化が止まり終了。' : 'Top: stopped after no more changes were detected.');
    } else {
      lines.push(this.isJapanese() ? '上側: 先頭到達は未確定。' : 'Top: reaching the start is not confirmed.');
    }
    if ((quality.topSettleIterations || 0) > 0){
      lines.push(this.isJapanese()
        ? `先頭追い込み回数: ${this.formatTimes(quality.topSettleIterations)}`
        : `Top settle rounds: ${this.formatTimes(quality.topSettleIterations)}`);
    }
    if ((quality.topSettleNewMessages || 0) > 0){
      lines.push(this.isJapanese()
        ? `追い込み追加会話: ${this.formatCount(quality.topSettleNewMessages)}`
        : `New messages added during top settle: ${this.formatNumber(quality.topSettleNewMessages)}`);
    }

    if (quality.bottomReached){
      lines.push(this.isJapanese() ? '下側: 末尾まで確認済み。' : 'Bottom: confirmed to the end.');
    } else if (quality.bottomEarlyExit){
      lines.push(this.isJapanese() ? '下側: 途中で変化が止まり終了。' : 'Bottom: stopped after no more changes were detected.');
    } else {
      lines.push(this.isJapanese() ? '下側: 末尾到達は未確定。' : 'Bottom: reaching the end is not confirmed.');
    }

    lines.push(this.isJapanese()
      ? `最終追加会話: ${this.formatCount(quality.finalNewMessages)}`
      : `Final new messages: ${this.formatNumber(quality.finalNewMessages)}`);

    if ((quality.expandClicks || 0) > 0){
      lines.push(this.isJapanese()
        ? `自動で本文を広げた回数: ${this.formatTimes(quality.expandClicks)}`
        : `Auto-expands: ${this.formatTimes(quality.expandClicks)}`);
    }
    if ((quality.unknownMessages || 0) > 0){
      lines.push(this.isJapanese()
        ? `注意: 話者を判定できない会話が ${this.formatCount(quality.unknownMessages)} あります。`
        : `Note: ${this.formatNumber(quality.unknownMessages)} messages have unknown speakers.`);
    }
    if ((quality.weakIdentityMessages || 0) > 0 && !quality.identityStable){
      lines.push(this.isJapanese()
        ? `注意: 重複判定が弱い会話が ${this.formatCount(quality.weakIdentityMessages)} あります。`
        : `Note: ${this.formatNumber(quality.weakIdentityMessages)} messages have weak identity detection.`);
    }
    if ((quality.orderGraphCycles || 0) > 0){
      lines.push(this.isJapanese()
        ? `注意: 会話順の矛盾候補が ${this.formatCount(quality.orderGraphCycles)} あります。`
        : `Note: ${this.formatNumber(quality.orderGraphCycles)} possible ordering inconsistencies were detected.`);
    }
    return lines;
  }

  buildOutputPreviewText(output, maxChars=1200){
    const normalized = String(output || '').trim();
    if (!normalized){
      return {title:this.isJapanese() ? '保存内容プレビュー' : 'Saved content preview', text:this.isJapanese() ? '(空)' : '(empty)'};
    }
    if (normalized.length <= maxChars){
      return {title:this.isJapanese() ? '保存内容プレビュー' : 'Saved content preview', text:normalized};
    }
    return {
      title:this.isJapanese()
        ? `保存内容プレビュー（先頭${maxChars.toLocaleString(this.numberLocale())}文字）`
        : `Saved content preview (first ${maxChars.toLocaleString(this.numberLocale())} chars)`,
      text:this.isJapanese()
        ? `${normalized.slice(0, maxChars).trimEnd()}\n\n…（以下省略）`
        : `${normalized.slice(0, maxChars).trimEnd()}\n\n... (truncated)`
    };
  }

  buildOutputPreview(messages, quality, diff){
    const {output} = this.formatOutput(messages, quality, diff);
    return this.buildOutputPreviewText(output);
  }

  formatOutput(messages, quality, diff, preset=this.config.preset){
    const title = this.adapter.getTitle();
    const savedAt = Utils.formatDateJST(new Date());
    const site = this.getSiteLabel();
    const url = location.href;
    const formatId = this.getFormatId();
    const formatDef = this.getFormatDef();
    const metadata = this.buildExportMetadata(title, messages, quality, diff, preset);
    const yaml = this.dumpYaml(metadata);

    if (formatId==='json'){
      const payload = {
        metadata: {
          ...metadata,
          site,
          url,
          saved_at: savedAt
        },
        messages: messages.map(m=>({role:this.roleLabel(m.role), roleRaw:m.role, content:m.content}))
      };
      return {fileName:this.makeFileName(title), output: JSON.stringify(payload, null, 2)};
    }

    let out = '';

    if (formatId==='txt'){
      if (this.isTxtHeaderEnabled()){
        out += this.isJapanese()
          ? `${title}\n\n- 形式: ${formatDef.label}\n- サイト: ${site}\n- 保存日時: ${savedAt}\n- URL: ${url}\n- 会話数: ${this.formatNumber(messages.length)}\n- 品質判定: ${metadata.quality_status} (${this.formatPoints(metadata.quality_score)})\n- 警告: ${metadata.warning_text}\n\n================\n\n`
          : this.isChinese()
          ? `${title}\n\n- 格式: ${formatDef.label}\n- 站点: ${site}\n- 保存时间: ${savedAt}\n- URL: ${url}\n- 消息数: ${this.formatNumber(messages.length)}\n- 质量状态: ${metadata.quality_status} (${this.formatPoints(metadata.quality_score)})\n- 警告: ${metadata.warning_text}\n\n================\n\n`
          : `${title}\n\n- Format: ${formatDef.label}\n- Site: ${site}\n- Saved at: ${savedAt}\n- URL: ${url}\n- Messages: ${this.formatNumber(messages.length)}\n- Quality: ${metadata.quality_status} (${this.formatPoints(metadata.quality_score)})\n- Warning: ${metadata.warning_text}\n\n================\n\n`;
      }
      for (let i=0;i<messages.length;i++){
        const m = messages[i];
        const body = PlainTextFormatter.fromMarkdown(m.content || '');
        out += `${this.roleLabel(m.role)}:\n${body || this.text('(空)', '(empty)', '(空)')}\n\n`;
        if (i < messages.length-1) out += `----------------\n\n`;
      }
      return {fileName:this.makeFileName(title), output: out.trim()+'\n'};
    }

    if (ENABLE_OBSIDIAN_FORMAT && formatId==='obs'){
      out += yaml;
      out += this.isJapanese()
        ? `# ${title}\n\n- サイト: ${site}\n- 保存日時: ${savedAt}\n- URL: ${url}\n\n---\n\n`
        : this.isChinese()
        ? `# ${title}\n\n- 站点: ${site}\n- 保存时间: ${savedAt}\n- URL: ${url}\n\n---\n\n`
        : `# ${title}\n\n- Site: ${site}\n- Saved at: ${savedAt}\n- URL: ${url}\n\n---\n\n`;
      for (const m of messages){
        const callout = (m.role==='User')
          ? `[!NOTE] ${this.roleLabel('User')}`
          : (m.role==='Model'
              ? '[!TIP] AI'
              : `[!INFO] ${this.text('その他', 'Other', '其他')}`);
        const body = (m.content||'').replace(/\n/g,'\n> ');
        out += `> ${callout}\n> ${body}\n\n`;
      }
      return {fileName:this.makeFileName(title), output: out.trim()+'\n'};
    }

    // 標準Markdown（YAMLあり）
    out += yaml;
    out += `# ${title}\n\n`;
    out += this.isJapanese()
      ? `- サイト: ${site}\n- 保存日時: ${savedAt}\n- URL: ${url}\n- 会話数: ${this.formatNumber(messages.length)}\n\n---\n\n`
      : this.isChinese()
      ? `- 站点: ${site}\n- 保存时间: ${savedAt}\n- URL: ${url}\n- 消息数: ${this.formatNumber(messages.length)}\n\n---\n\n`
      : `- Site: ${site}\n- Saved at: ${savedAt}\n- URL: ${url}\n- Messages: ${this.formatNumber(messages.length)}\n\n---\n\n`;
    for (let i=0;i<messages.length;i++){
      const m = messages[i];
      out += `## ${this.roleLabel(m.role)}\n\n${(m.content||'').trim()}\n\n`;
      if (i < messages.length-1) out += `---\n\n`;
    }
    return {fileName:this.makeFileName(title), output: out.trim()+'\n'};
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
      // revokeは早すぎると失敗することがあるので余裕を置く
      setTimeout(()=>{ try{URL.revokeObjectURL(url);}catch{} try{a.remove();}catch{} }, 12000);
      return true;
    }catch{
      return false;
    }
  }

  async showResultDialog(messages, quality, options={}){
    return new Promise(resolve=>{
      const isJa = this.isJapanese();
      const isZh = this.isChinese();
      const alternateSnapshot = options?.alternateSnapshot || null;
      const alternateTitle = options?.alternateTitle || this.text('保持中の結果', 'Saved alternate result', '已保留的另一份结果');
      const alternateButtonLabel = options?.alternateButtonLabel || this.text('別の結果を見る', 'View alternate result', '查看另一份结果');
      const resultPreset = options?.preset || this.config.preset;
      const diff = this.diffInfo(messages, alternateSnapshot);
      const summary = this.qualitySummary(quality, diff);
      const title = this.adapter.getTitle();
      const {fileName, output} = this.formatOutput(messages, quality, diff, resultPreset);
      const byteSize = new TextEncoder().encode(output).length;
      let currentFileName = fileName;

      const ov = this.overlay();
      const modal = Utils.el('div',{style:`width:min(720px, calc(100vw - 32px));background:${THEME.surface};border:1px solid ${THEME.border};border-radius:16px;overflow:hidden;box-shadow:0 10px 28px rgba(0,0,0,.4);color:${THEME.fg};`});

      const header = Utils.el('div',{style:`padding:20px 22px;background:${THEME.bg};border-bottom:1px solid ${THEME.border};`},[
        Utils.el('div',{text:this.text('保存前の確認', 'Review before saving', '保存前确认'),style:'font-size:20px;line-height:1.35;font-weight:700;margin-bottom:6px;'}),
        Utils.el('div',{text:isJa ? `判定: ${summary.label}（${this.formatPoints(summary.score)}）` : isZh ? `状态: ${summary.label}（${this.formatPoints(summary.score)}）` : `Status: ${summary.label} (${this.formatPoints(summary.score)})`,style:`font-size:14px;line-height:1.6;color:${summary.color};font-weight:700;`}),
        Utils.el('div',{text:summary.hint,style:`margin-top:6px;font-size:14px;line-height:1.65;color:${THEME.muted};font-weight:500;`}),
        summary.diffLine ? Utils.el('div',{text:summary.diffLine,style:`margin-top:6px;font-size:14px;line-height:1.65;color:${THEME.muted};font-weight:500;`}) : null
      ].filter(Boolean));

      const body = Utils.el('div',{style:'padding:18px 22px;'});
      const compact = Utils.el('div',{style:'display:grid;gap:6px;padding:12px;border-radius:12px;border:1px solid '+THEME.border+';background:'+THEME.bg+';margin-bottom:12px;font-size:14px;line-height:1.55;font-weight:500;'});
      let saveState = this.text('未保存', 'Not saved', '未保存');
      const renderCompact = () => {
        compact.textContent = '';
        const lines = this.compactSummaryLines(messages, quality, diff, saveState);
        for(const line of lines){
          compact.appendChild(Utils.el('div',{text:line,style:'color:'+THEME.fg+';'}));
        }
      };
      const setSaveState = (state) => {
        saveState = `${state}`;
        renderCompact();
      };
      renderCompact();
      body.appendChild(compact);

      const grid = Utils.el('div',{style:'display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px;'});
      const baseLabel = this.comparisonBaseLabel(diff);
      const diffChip = (()=>{
        if (!diff.previous) return this.chip(this.text('前回', 'Previous', '上一次'), this.text('なし', 'None', '无'), THEME.muted);
        const sign = diff.diff>0?'+':'';
        const ratePct = Math.round((diff.rate||0)*100);
        const txt = isJa ? `${sign}${this.formatCount(diff.diff)} (${ratePct}%)` : isZh ? `${sign}${this.formatCount(diff.diff)} (${ratePct}%)` : `${sign}${this.formatNumber(diff.diff)} (${ratePct}%)`;
        const col = diff.stable ? THEME.ok : (ratePct>=12 ? THEME.bad : THEME.warn);
        return this.chip(this.text('前回比', 'Delta', '与上次相比'), txt, col);
      })();

      grid.append(
        this.chip(this.text('会話数', 'Messages', '消息数'), isJa || isZh ? this.formatCount(messages.length) : this.formatNumber(messages.length)),
        this.chip(this.text('比較', 'Compare', '比较'), baseLabel),
        this.chip(this.text('速度', 'Mode', '运行模式'), this.getPresetLabelFor(resultPreset)),
        this.chip(this.text('形式', 'Format', '格式'), this.getFormatLabel()),
        diffChip
      );
      body.appendChild(grid);

      if (alternateSnapshot){
        const altBox = Utils.el('div',{style:`margin-top:12px;padding:12px 14px;border-radius:14px;border:1px solid ${THEME.border};background:${THEME.bg};display:grid;gap:6px;`});
        altBox.appendChild(Utils.el('div',{text:alternateTitle,style:`font-size:14px;line-height:1.55;color:${THEME.muted};font-weight:700;`}));
        for (const line of this.buildResultSnapshotSummaryLines(alternateSnapshot)){
          altBox.appendChild(Utils.el('div',{text:line,style:`font-size:14px;line-height:1.6;color:${THEME.fg};font-weight:500;`}));
        }
        body.appendChild(altBox);
      }

      const previewData = this.buildOutputPreviewText(output);

      // プレビュー（保存内容）
      const preview = Utils.el('details',{style:`margin-top:14px;border:1px solid ${THEME.border};border-radius:14px;background:${THEME.bg};overflow:hidden;`});
      preview.appendChild(Utils.el('summary',{text:previewData.title,style:`cursor:pointer;list-style:none;padding:12px 14px;font-weight:700;font-size:14px;line-height:1.5;`}));
      const pvInner = Utils.el('div',{style:'padding:12px 14px;border-top:1px solid '+THEME.border+';'});
      pvInner.appendChild(Utils.el('pre',{text:previewData.text,style:`margin:0;white-space:pre-wrap;word-break:break-word;font:12px/1.65 ${THEME.mono};color:${THEME.fg};`}));
      preview.appendChild(pvInner);
      body.appendChild(preview);

      // 詳細（品質）
      if (quality){
        const detail = Utils.el('details',{style:`margin-top:12px;border:1px solid ${THEME.border};border-radius:14px;background:${THEME.bg};overflow:hidden;`});
        detail.appendChild(Utils.el('summary',{text:this.text('くわしい判定を見る', 'Show quality details', '查看质量详情'),style:`cursor:pointer;list-style:none;padding:12px 14px;font-weight:700;font-size:14px;line-height:1.5;`}));
        const detailInner = Utils.el('div',{style:'padding:12px 14px;border-top:1px solid '+THEME.border+';display:grid;gap:10px;'});
        const userSummary = Utils.el('div',{style:'display:grid;gap:6px;'});
        for (const line of this.buildQualityUserSummaryLines(quality)){
          userSummary.appendChild(Utils.el('div',{text:line,style:`font-size:14px;line-height:1.65;color:${THEME.fg};font-weight:500;`}));
        }
        detailInner.appendChild(userSummary);

        const seDetail = Utils.el('details',{style:`border:1px solid ${THEME.border};border-radius:12px;background:${THEME.surface};overflow:hidden;`});
        seDetail.appendChild(Utils.el('summary',{text:this.text('技術詳細を見る', 'Show technical details', '查看技术详情'),style:`cursor:pointer;list-style:none;padding:10px 12px;font-weight:700;font-size:13px;line-height:1.5;color:${THEME.muted};`}));
        seDetail.appendChild(Utils.el('pre',{text:this.buildQualityDetailText(quality),style:`margin:0;padding:12px;border-top:1px solid ${THEME.border};white-space:pre-wrap;word-break:break-word;font:12px/1.6 ${THEME.mono};color:${THEME.muted};`}));
        detailInner.appendChild(seDetail);

        detail.appendChild(detailInner);
        body.appendChild(detail);
      }

      // 保存予定ファイル名
      const fileBox = Utils.el('div',{style:`margin-top:12px;padding:12px 14px;border-radius:14px;border:1px solid ${THEME.border};background:${THEME.bg};display:grid;gap:10px;`});
      fileBox.appendChild(Utils.el('div',{text:this.text('保存されるファイル名', 'Output file name', '输出文件名'),style:`font-size:14px;line-height:1.55;color:${THEME.muted};font-weight:700;`}));
      const fileInput = Utils.el('input',{
        type:'text',
        value:fileName,
        spellcheck:'false',
        style:`width:100%;border-radius:12px;border:1px solid ${THEME.border};background:${THEME.surface};color:${THEME.fg};padding:10px 12px;font:600 14px/1.5 ${THEME.font};`
      });
      const fileHint = Utils.el('div',{text:isJa ? `出力サイズ: ${this.formatByteSize(byteSize)} (${byteSize.toLocaleString(this.numberLocale())} bytes)` : isZh ? `输出大小: ${this.formatByteSize(byteSize)} (${byteSize.toLocaleString(this.numberLocale())} bytes)` : `Output size: ${this.formatByteSize(byteSize)} (${byteSize.toLocaleString(this.numberLocale())} bytes)`,style:`font-size:13px;line-height:1.6;color:${THEME.muted};font-weight:500;`});
      fileInput.addEventListener('input', ()=>{
        currentFileName = this.normalizeDownloadFileName(fileInput.value, fileName);
      });
      fileInput.addEventListener('blur', ()=>{
        currentFileName = this.normalizeDownloadFileName(fileInput.value, fileName);
        fileInput.value = currentFileName;
      });
      fileBox.append(fileInput, fileHint);
      body.appendChild(fileBox);

      // 手動コピー欄
      const manual = Utils.el('details',{style:`margin-top:12px;border:1px solid ${THEME.border};border-radius:14px;background:${THEME.bg};overflow:hidden;`});
      manual.appendChild(Utils.el('summary',{text:this.text('手動コピー欄（コピーできない時用）', 'Manual copy', '手动复制'),style:`cursor:pointer;list-style:none;padding:12px 14px;font-weight:700;font-size:14px;line-height:1.5;`}));
      const manInner = Utils.el('div',{style:'padding:12px 14px;border-top:1px solid '+THEME.border+';display:grid;gap:10px;'});
      const ta = Utils.el('textarea',{style:`width:100%;min-height:180px;border-radius:12px;border:1px solid ${THEME.border};background:${THEME.surface};color:${THEME.fg};padding:10px 12px;font:500 14px/1.65 ${THEME.mono};`, spellcheck:'false'});
      ta.value = output;
      const manBtns = Utils.el('div',{style:'display:flex;gap:10px;flex-wrap:wrap;justify-content:flex-end;'});
      const selectAll = ()=>{ ta.focus(); ta.select(); try{ ta.setSelectionRange(0, ta.value.length);}catch{} };
      manBtns.append(
        this.btn(this.text('全選択', 'Select all', '全选'),'secondary', ()=>{ selectAll(); Utils.toast(this.text('全選択しました。Ctrl/Cmd+Cでコピーできます。', 'Selected all. Press Ctrl/Cmd+C to copy.', '已全选。请按 Ctrl/Cmd+C 复制。'), 'info'); }),
        this.btn(this.text('コピー（可能なら）', 'Copy from this area', '从这里复制'),'secondary', async ()=>{
          selectAll();
          try{
            await navigator.clipboard.writeText(ta.value);
            Utils.toast(this.text('クリップボードにコピーしました。', 'Copied to the clipboard.', '已复制到剪贴板。'), 'success');
          }catch{
            Utils.toast(this.text('コピーできませんでした。全選択済みなので手動でコピーしてください。', 'Copy failed. The text is selected, so copy it manually.', '复制失败。文本已全选，请手动复制。'), 'warn', 3500);
          }
        })
      );
      manInner.append(ta, manBtns);
      manual.appendChild(manInner);
      body.appendChild(manual);

      const footer = Utils.el('div',{style:`padding:16px 22px;background:${THEME.bg};border-top:1px solid ${THEME.border};display:flex;gap:10px;justify-content:flex-end;flex-wrap:wrap;`});

      const finish=(action)=>{
        try{ ov.remove(); }catch{}
        resolve(action);
      };

      const finalizeWithState = async (action, state, nextStateMs=220) => {
        setSaveState(state || this.text('保存状態更新中', 'Updating save state', '正在更新保存状态'));
        await Utils.sleep(nextStateMs);
        finish(action);
      };

      const footerButtons = [
        this.btn(this.text('中止', 'Cancel', '取消'),'subtle', ()=>finish({action:'cancel'})),
        alternateSnapshot ? this.btn(alternateButtonLabel,'secondary', ()=>finish({action:'show_alternate_result'})) : null,
        this.btn(this.text('ていねいに再実行', 'Rerun carefully', '细致重试'),'secondary', async ()=>{
          const ok = await this.confirmRerunDialog('careful');
          if (ok) finish({action:'rerun_careful'});
        }),
        this.btn(this.text('クリップボードにコピー', 'Copy to clipboard', '复制到剪贴板'),'secondary', async ()=>{
          try{
            await navigator.clipboard.writeText(output);
            Utils.toast(this.text('クリップボードにコピーしました。', 'Copied to the clipboard.', '已复制到剪贴板。'), 'success');
            await finalizeWithState({action:'done_clipboard', saveState:'clipboard'}, this.text('クリップボード保存済み', 'Saved to clipboard', '已保存到剪贴板'));
          }catch{
            Utils.toast(this.text('コピーできなかったため、ファイル保存に切り替えます。', 'Clipboard copy failed, switching to file save.', '复制到剪贴板失败，改为保存文件。'), 'warn', 3200);
            const ok = this.downloadFile(currentFileName, output);
            if (ok){
              await finalizeWithState({action:'done_file', saveState:'file'}, this.text('ファイル保存済み', 'Saved as file', '已保存为文件'));
            }else{
              setSaveState(this.text('コピー/保存に失敗', 'Copy/save failed', '复制/保存失败'));
              Utils.toast(this.text('保存に失敗しました。', 'Save failed.', '保存失败。'), 'error', 2200);
              finish({action:'done_fail', saveState:'failed'});
            }
          }
        }),
        this.btn(this.text('保存（ファイル）', 'Save file', '保存文件'),'primary', ()=>{
          const ok = this.downloadFile(currentFileName, output);
          if (ok){
            finalizeWithState({action:'done_file', saveState:'file'}, this.text('ファイル保存済み', 'Saved as file', '已保存为文件'));
          }else{
            setSaveState(this.text('保存失敗', 'Save failed', '保存失败'));
            finish({action:'done_fail', saveState:'failed'});
          }
        })
      ].filter(Boolean);
      footer.append(...footerButtons);

      modal.append(header, body, footer);
      ov.appendChild(modal);
      document.body.appendChild(ov);
    });
  }

  async runOnce({skipConfig=false, presetOverride=null}={}){
    const proceed = skipConfig ? true : await this.showConfigDialog();
    if (!proceed) return {action:'cancel'};

    const effectiveConfig = this.configForRun(presetOverride);
    const effectivePreset = effectiveConfig.preset || this.config.preset;
    this.abortState = {aborted:false, lang: effectiveConfig.lang};
    const attemptId = this.markRunAttemptStart(effectivePreset);
    this.showBusyDialog();
    let res=null;
    try{
      res = await ScrollEngine.harvest(this.adapter, effectiveConfig, (p)=>this.updateBusyDialog(p), this.abortState);
    } finally {
      this.closeBusyDialog();
    }

    const messages = res?.messages || [];
    const quality = res?.quality || null;

    if (!messages.length){
      this.setRunAttemptStatus('failed', {
        attempt_id: attemptId,
        mode: effectivePreset,
        reason: 'no_messages'
      });
      if (this.pendingRerunSnapshot){
        Utils.toast(this.isJapanese() ? '再取得に失敗したため、保持していた前回結果を再表示します。' : 'Rerun failed, so the previously kept result will be shown again.', 'warn', 4200);
        const fallback = await this.resolveResultDialogChoice(this.pendingRerunSnapshot, null);
        this.handleRunDialogResult(fallback.result, fallback.snapshot, attemptId);
        return fallback.result;
      }
      Utils.toast(this.isJapanese() ? '会話を見つけられませんでした。ページ表示が変わったか、未対応の可能性があります。' : 'No messages were found. The page may have changed or the site may not be supported yet.', 'error', 4200);
      return {action:'cancel'};
    }

    const currentSnapshot = this.createResultSnapshot(messages, quality, {preset:effectivePreset});
    const chosen = await this.resolveResultDialogChoice(currentSnapshot, this.pendingRerunSnapshot);
    this.handleRunDialogResult(chosen.result, chosen.snapshot, attemptId);
    return chosen.result;
  }

  async run(){
    try{
      let rerunOptions = {skipConfig:false};
      for(;;){
        const r = await this.runOnce(rerunOptions);
        rerunOptions = {skipConfig:true};
        if (!r || r.action==='cancel') break;
        if (r.action==='rerun_careful'){
          rerunOptions = {skipConfig:true, presetOverride:'careful'};
          continue;
        }
        break;
      }
    }catch(err){
      console.error('[AI Chat Export]', err);
      const msg = String(err?.message||err||'');
      if (msg.includes('中断しました') || msg.includes('Aborted')){
        Utils.toast(this.isJapanese() ? '中断しました。' : 'Aborted.','warn', 3200);
      } else {
        Utils.toast(this.isJapanese() ? `失敗しました: ${msg}` : `Failed: ${msg}`, 'error', 4200);
      }
    } finally {
window.__AI_CHAT_EXPORT_RUNNING__ = false;
    }
  }
}

const app = new App();
await app.run();

})();
