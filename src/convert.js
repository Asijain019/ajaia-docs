import mammoth from 'mammoth';
import sanitizeHtml from 'sanitize-html';

export const ALLOWED_UPLOADS = ['.txt', '.md', '.docx'];
const safeColor = [/^#[0-9a-f]{6}$/i, /^rgb\(\s*(?:25[0-5]|2[0-4]\d|1?\d?\d)\s*,\s*(?:25[0-5]|2[0-4]\d|1?\d?\d)\s*,\s*(?:25[0-5]|2[0-4]\d|1?\d?\d)\s*\)$/i];

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Allow-list sanitizer: the stored HTML is only ever the subset the editor can produce.
export function clean(html) {
  return sanitizeHtml(html || '', {
    allowedTags: ['h1', 'h2', 'h3', 'p', 'br', 'b', 'strong', 'i', 'em', 'u', 'span', 'ul', 'ol', 'li', 'blockquote', 'div'],
    allowedAttributes: { span: ['style'], p: ['style'], h1: ['style'], h2: ['style'], h3: ['style'], li: ['style'], blockquote: ['style'], div: ['style'] },
    allowedStyles: {
      '*': {
        color: safeColor,
        'background-color': [...safeColor, /^transparent$/i],
        'font-size': [/^(?:12|14|16|18|20|22|24|28|32|36|48)px$/],
        'text-align': [/^(?:left|center|right|justify)$/],
      },
    },
  });
}

export function textToHtml(text) {
  return text.split(/\r?\n\s*\r?\n/).filter((p) => p.trim())
    .map((p) => `<p>${esc(p.trim()).replace(/\r?\n/g, '<br>')}</p>`).join('') || '<p><br></p>';
}

const inline = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/\*(.+?)\*/g, '<i>$1</i>');

// Deliberately small Markdown subset: headings, bold/italic, bullet + numbered lists, paragraphs.
export function markdownToHtml(md) {
  const out = []; let list = null; let para = [];
  const flushPara = () => { if (para.length) out.push(`<p>${para.join('<br>')}</p>`); para = []; };
  const closeList = () => { if (list) out.push(`</${list}>`); list = null; };
  for (const line of md.split(/\r?\n/)) {
    let m;
    if (!line.trim()) { flushPara(); closeList(); }
    else if ((m = line.match(/^(#{1,3})\s+(.*)/))) { flushPara(); closeList(); out.push(`<h${m[1].length}>${inline(m[2])}</h${m[1].length}>`); }
    else if ((m = line.match(/^\s*[-*]\s+(.*)/)) || (m = line.match(/^\s*\d+\.\s+(.*)/))) {
      flushPara();
      const kind = /^\s*[-*]/.test(line) ? 'ul' : 'ol';
      if (list !== kind) { closeList(); out.push(`<${kind}>`); list = kind; }
      out.push(`<li>${inline(m[1])}</li>`);
    } else { closeList(); para.push(inline(line.trim())); }
  }
  flushPara(); closeList();
  return out.join('') || '<p><br></p>';
}

export async function fileToHtml(name, buffer) {
  const ext = name.slice(name.lastIndexOf('.')).toLowerCase();
  if (ext === '.txt') return clean(textToHtml(buffer.toString('utf8')));
  if (ext === '.md') return clean(markdownToHtml(buffer.toString('utf8')));
  if (ext === '.docx') return clean((await mammoth.convertToHtml({ buffer })).value || '<p><br></p>');
  throw Object.assign(new Error(`Unsupported file type. Allowed: ${ALLOWED_UPLOADS.join(', ')}`), { status: 400 });
}

// Export: the stored HTML is already restricted to a tiny tag set, so a small regex converter is enough.
const unesc = (s) => s.replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');
export function htmlToMarkdown(html) {
  let s = (html || '').replace(/<div>/g, '<p>').replace(/<\/div>/g, '</p>');
  const inl = (t) => t.replace(/<(b|strong)>(.*?)<\/\1>/g, '**$2**').replace(/<(i|em)>(.*?)<\/\1>/g, '*$2*').replace(/<br\s*\/?>/g, '  \n');
  s = s.replace(/<(ul|ol)>([\s\S]*?)<\/\1>/g, (_, kind, body) => {
    let n = 0;
    const items = [...body.matchAll(/<li>([\s\S]*?)<\/li>/g)].map((m) => `${kind === 'ol' ? `${++n}.` : '-'} ${inl(m[1]).replace(/<\/?[^>]+>/g, (t) => (/^<\/?u>$/.test(t) ? t : ''))}`);
    return `\n\n${items.join('\n')}\n\n`;
  });
  s = s.replace(/<h([1-3])>([\s\S]*?)<\/h\1>/g, (_, n, t) => `\n\n${'#'.repeat(n)} ${inl(t)}\n\n`)
    .replace(/<blockquote>([\s\S]*?)<\/blockquote>/g, (_, t) => `\n\n> ${inl(t)}\n\n`)
    .replace(/<p>([\s\S]*?)<\/p>/g, (_, t) => `\n\n${inl(t)}\n\n`);
  s = inl(s).replace(/<(?!\/?u>)[^>]+>/g, '');
  return unesc(s).replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim() + '\n';
}
