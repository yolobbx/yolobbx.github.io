#!/usr/bin/env node

import { existsSync } from 'node:fs';
import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const postsDir = path.join(rootDir, 'src/content/posts');
const defaultOutDir = path.join(rootDir, 'dist-publish');

const args = process.argv.slice(2);
const all = args.includes('--all');
const outFlagIndex = args.indexOf('--out');
const outDir = outFlagIndex >= 0 ? path.resolve(rootDir, args[outFlagIndex + 1]) : defaultOutDir;
const target = args.find((arg, index) => !arg.startsWith('--') && (outFlagIndex < 0 || index !== outFlagIndex + 1));

if (!all && !target) {
  console.error('Usage: npm run publish:post -- <post-slug-or-md-path> [--out dist-publish]');
  console.error('       npm run publish:all');
  process.exit(1);
}

if (all) {
  const files = await findMarkdownPosts(postsDir);
  for (const file of files) {
    await publishPost(file, outDir);
  }
  console.log(`Published ${files.length} posts to ${relative(outDir)}`);
} else {
  const file = await resolvePost(target);
  await publishPost(file, outDir);
}

async function publishPost(file, outputRoot) {
  const source = await readFile(file, 'utf8');
  const { frontmatter, body } = parseFrontmatter(source);
  const documentModel = toDocumentModel(body, frontmatter, slugFromFile(file));
  const presentationModel = toPresentationModel(documentModel, frontmatter);
  const slug = slugFromFile(file);
  const postOutDir = path.join(outputRoot, slug);
  const cardDir = path.join(postOutDir, 'xiaohongshu-cards');

  await mkdir(postOutDir, { recursive: true });
  await mkdir(cardDir, { recursive: true });
  await rm(cardDir, { recursive: true, force: true });
  await mkdir(cardDir, { recursive: true });

  const wechatHtml = renderWeChatHtml(documentModel, frontmatter);
  const wechatPreview = renderPlainPreview(documentModel);
  const xhs = renderXiaohongshu(presentationModel, frontmatter);

  await writeFile(path.join(postOutDir, 'document-model.json'), `${JSON.stringify(documentModel, null, 2)}\n`);
  await writeFile(path.join(postOutDir, 'presentation-model.json'), `${JSON.stringify(presentationModel, null, 2)}\n`);
  await writeFile(path.join(postOutDir, 'wechat.html'), wechatHtml);
  await writeFile(path.join(postOutDir, 'wechat-preview.txt'), wechatPreview);
  await writeFile(path.join(postOutDir, 'xiaohongshu-caption.md'), xhs.caption);
  await writeFile(path.join(postOutDir, 'xiaohongshu-preview.html'), renderCardPreview(xhs.cards));

  for (const [index, card] of xhs.cards.entries()) {
    const filename = `${String(index + 1).padStart(2, '0')}-${card.kind}.svg`;
    await writeFile(path.join(cardDir, filename), renderCardSvg(card, index + 1, xhs.cards.length));
  }

  console.log(`Published ${relative(file)} -> ${relative(postOutDir)}`);
}

async function findMarkdownPosts(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await findMarkdownPosts(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      files.push(fullPath);
    }
  }

  return files.sort();
}

async function resolvePost(input) {
  const direct = path.resolve(rootDir, input);
  const candidates = [
    direct,
    path.join(postsDir, input, 'index.md'),
    path.join(postsDir, `${input}.md`),
  ];

  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate;
  }

  const files = await findMarkdownPosts(postsDir);
  const matches = files.filter((file) => slugFromFile(file) === input);
  if (matches.length === 1) return matches[0];

  throw new Error(`Cannot find post: ${input}`);
}

function parseFrontmatter(source) {
  if (!source.startsWith('---\n')) {
    return { frontmatter: {}, body: source };
  }

  const end = source.indexOf('\n---', 4);
  if (end === -1) {
    return { frontmatter: {}, body: source };
  }

  const raw = source.slice(4, end);
  const body = source.slice(source.indexOf('\n', end + 4) + 1);
  const frontmatter = {};

  for (const line of raw.split('\n')) {
    const match = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!match) continue;
    const [, key, value] = match;
    frontmatter[key] = parseYamlValue(value);
  }

  return { frontmatter, body };
}

function parseYamlValue(value) {
  const trimmed = value.trim();
  if (trimmed === 'true') return true;
  if (trimmed === 'false') return false;
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function toDocumentModel(markdown, frontmatter, fallbackSlug) {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const blocks = [];
  let paragraph = [];
  let code = null;

  for (const line of lines) {
    const fence = line.match(/^```(.*)$/);
    if (fence) {
      flushParagraph();
      if (code) {
        blocks.push({ type: 'code', lang: code.lang, text: code.lines.join('\n') });
        code = null;
      } else {
        code = { lang: fence[1].trim(), lines: [] };
      }
      continue;
    }

    if (code) {
      code.lines.push(line);
      continue;
    }

    if (!line.trim()) {
      flushParagraph();
      continue;
    }

    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      flushParagraph();
      blocks.push({ type: 'heading', level: heading[1].length, text: stripInline(heading[2]) });
      continue;
    }

    if (/^(-{3,}|\*{3,})$/.test(line.trim())) {
      flushParagraph();
      blocks.push({ type: 'divider' });
      continue;
    }

    const image = line.trim().match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (image) {
      flushParagraph();
      blocks.push({ type: 'image', alt: image[1], src: image[2] });
      continue;
    }

    const quote = line.match(/^>\s?(.*)$/);
    if (quote) {
      flushParagraph();
      const previous = blocks.at(-1);
      if (previous?.type === 'quote') {
        previous.text = `${previous.text}\n${stripInline(quote[1])}`;
      } else {
        blocks.push({ type: 'quote', text: stripInline(quote[1]) });
      }
      continue;
    }

    const list = line.match(/^(\s*)([-*+]|\d+\.)\s+(.+)$/);
    if (list) {
      flushParagraph();
      const ordered = /\d+\./.test(list[2]);
      const previous = blocks.at(-1);
      const item = stripInline(list[3]);
      if (previous?.type === 'list' && previous.ordered === ordered) {
        previous.items.push(item);
      } else {
        blocks.push({ type: 'list', ordered, items: [item] });
      }
      continue;
    }

    paragraph.push(line.trim());
  }

  flushParagraph();

  const firstHeading = blocks.find((block) => block.type === 'heading' && block.level === 1);
  const title = frontmatter.title || firstHeading?.text || fallbackSlug;

  return {
    type: 'document',
    title,
    slug: fallbackSlug,
    description: frontmatter.description || '',
    date: frontmatter.date || '',
    category: frontmatter.category || '',
    blocks,
  };

  function flushParagraph() {
    if (!paragraph.length) return;
    blocks.push({ type: 'paragraph', text: paragraph.join(' ') });
    paragraph = [];
  }
}

function toPresentationModel(documentModel, frontmatter) {
  const sections = [];
  const images = [];
  let current = { heading: '开头', paragraphs: [], bullets: [], callout: '' };

  for (const block of documentModel.blocks) {
    if (block.type === 'heading' && block.level === 2) {
      pushCurrent();
      current = { heading: block.text, paragraphs: [], bullets: [], callout: '' };
      continue;
    }

    if (block.type === 'heading' && block.level === 3) {
      current.paragraphs.push(block.text);
      continue;
    }

    if (block.type === 'paragraph') current.paragraphs.push(stripInline(block.text));
    if (block.type === 'list') current.bullets.push(...block.items.map(stripInline));
    if (block.type === 'quote') current.callout = [current.callout, block.text].filter(Boolean).join('\n');
    if (block.type === 'image') images.push({ src: block.src, alt: block.alt });
  }

  pushCurrent();

  const summary = frontmatter.description || firstParagraph(documentModel.blocks) || '';
  const tags = unique([
    frontmatter.category,
    '个人网站',
    '博客',
    ...keywordTags(documentModel.title),
  ].filter(Boolean));

  return {
    title: documentModel.title,
    subtitle: frontmatter.category || '',
    summary,
    sections,
    quotes: documentModel.blocks.filter((block) => block.type === 'quote').map((block) => block.text),
    images,
    tags,
    cta: '更多完整内容见个人网站',
  };

  function pushCurrent() {
    if (current.paragraphs.length || current.bullets.length || current.callout) {
      sections.push(current);
    }
  }
}

function renderWeChatHtml(documentModel, frontmatter) {
  const blocks = documentModel.blocks.map(renderWeChatBlock).join('\n');
  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(documentModel.title)}</title>
</head>
<body>
  <article style="max-width: 680px; margin: 0 auto; padding: 24px 16px; color: #222; font-size: 16px; line-height: 1.85; font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;">
    <h1 style="margin: 0 0 12px; font-size: 26px; line-height: 1.35; color: #111;">${escapeHtml(documentModel.title)}</h1>
    ${frontmatter.description ? `<p style="margin: 0 0 28px; color: #666;">${escapeHtml(frontmatter.description)}</p>` : ''}
${blocks}
  </article>
</body>
</html>
`;
}

function renderWeChatBlock(block) {
  if (block.type === 'heading') {
    const tag = `h${Math.min(block.level + 1, 4)}`;
    const style = block.level === 2
      ? 'margin: 34px 0 14px; padding-left: 10px; border-left: 4px solid #B84A2D; font-size: 21px; line-height: 1.45; color: #111;'
      : 'margin: 26px 0 12px; font-size: 18px; line-height: 1.5; color: #222;';
    return `    <${tag} style="${style}">${escapeHtml(block.text)}</${tag}>`;
  }

  if (block.type === 'paragraph') {
    return `    <p style="margin: 16px 0;">${renderInlineHtml(block.text)}</p>`;
  }

  if (block.type === 'list') {
    const tag = block.ordered ? 'ol' : 'ul';
    const items = block.items.map((item) => `<li style="margin: 6px 0;">${renderInlineHtml(item)}</li>`).join('');
    return `    <${tag} style="margin: 16px 0; padding-left: 1.4em;">${items}</${tag}>`;
  }

  if (block.type === 'quote') {
    return `    <blockquote style="margin: 20px 0; padding: 10px 14px; border-left: 4px solid #ddd; background: #fafafa; color: #555;">${escapeHtml(block.text).replace(/\n/g, '<br>')}</blockquote>`;
  }

  if (block.type === 'code') {
    return `    <pre style="margin: 18px 0; padding: 14px; overflow-x: auto; background: #f6f6f6; border-radius: 8px; font-size: 14px; line-height: 1.65;"><code>${escapeHtml(block.text)}</code></pre>`;
  }

  if (block.type === 'image') {
    const alt = escapeHtml(block.alt || '');
    return `    <figure style="margin: 22px 0;"><img src="${escapeHtml(block.src)}" alt="${alt}" style="max-width: 100%; height: auto; display: block;"><figcaption style="margin-top: 8px; color: #888; font-size: 13px; text-align: center;">${alt}</figcaption></figure>`;
  }

  if (block.type === 'divider') {
    return '    <hr style="margin: 30px 0; border: 0; border-top: 1px solid #eee;">';
  }

  return '';
}

function renderPlainPreview(documentModel) {
  const lines = [`# ${documentModel.title}`, ''];
  for (const block of documentModel.blocks) {
    if (block.type === 'heading') lines.push(`${'#'.repeat(block.level)} ${block.text}`, '');
    if (block.type === 'paragraph') lines.push(stripInline(block.text), '');
    if (block.type === 'list') lines.push(...block.items.map((item, index) => `${block.ordered ? `${index + 1}.` : '-'} ${item}`), '');
    if (block.type === 'quote') lines.push(`> ${block.text.replace(/\n/g, '\n> ')}`, '');
    if (block.type === 'code') lines.push('```', block.text, '```', '');
    if (block.type === 'image') lines.push(`[图片] ${block.alt} ${block.src}`, '');
    if (block.type === 'divider') lines.push('---', '');
  }
  return `${lines.join('\n').replace(/\n{3,}/g, '\n\n').trim()}\n`;
}

function renderXiaohongshu(model, frontmatter) {
  const cards = [];
  cards.push({
    kind: 'cover',
    eyebrow: model.subtitle || 'BLOG NOTE',
    title: model.title,
    body: model.summary,
  });

  const sections = model.sections.filter((section) => section.heading !== '开头' || section.paragraphs.length || section.bullets.length);
  const selectedSections = sections.slice(0, 7);
  for (const section of selectedSections) {
    cards.push({
      kind: 'page',
      eyebrow: '重点',
      title: shortTitle(section.heading),
      body: section.bullets.length ? section.bullets.slice(0, 4) : section.paragraphs.slice(0, 3),
      callout: section.callout,
    });
  }

  cards.push({
    kind: 'end',
    eyebrow: '总结',
    title: '这篇文章适合这样读',
    body: selectedSections.slice(0, 5).map((section) => section.heading),
    callout: model.cta,
  });

  const caption = [
    `# ${model.title}`,
    '',
    model.summary,
    '',
    ...selectedSections.slice(0, 5).map((section) => `- ${section.heading}`),
    '',
    model.cta,
    '',
    model.tags.map((tag) => `#${tag}`).join(' '),
    frontmatter.date ? `\n原文日期：${frontmatter.date}` : '',
  ].filter(Boolean).join('\n');

  return { cards, caption: `${caption}\n` };
}

function renderCardPreview(cards) {
  const body = cards.map((card, index) => {
    const svg = renderCardSvg(card, index + 1, cards.length);
    return `<section>${svg}</section>`;
  }).join('\n');

  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>小红书卡片预览</title>
  <style>
    body { margin: 0; padding: 24px; background: #e8dfd2; display: grid; gap: 24px; grid-template-columns: repeat(auto-fit, minmax(270px, 1fr)); }
    section { box-shadow: 0 16px 36px rgba(32, 23, 14, .18); border-radius: 28px; overflow: hidden; }
    svg { width: 100%; height: auto; display: block; }
  </style>
</head>
<body>
${body}
</body>
</html>
`;
}

function renderCardSvg(card, page, total) {
  const width = 1080;
  const height = 1440;
  const titleLines = wrapText(card.title, 13);
  const bodyItems = Array.isArray(card.body) ? card.body : [card.body].filter(Boolean);
  const bodyLines = bodyItems.flatMap((item) => wrapText(String(item), 24)).slice(0, card.kind === 'cover' ? 6 : 10);
  const calloutLines = card.callout ? wrapText(card.callout, 22).slice(0, 3) : [];
  const titleY = card.kind === 'cover' ? 360 : 260;
  const bodyY = titleY + titleLines.length * 86 + 80;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#fff7ea"/>
      <stop offset="55%" stop-color="#f1dfc6"/>
      <stop offset="100%" stop-color="#d88c63"/>
    </linearGradient>
    <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="22" stdDeviation="28" flood-color="#7b3d24" flood-opacity=".18"/>
    </filter>
  </defs>
  <rect width="1080" height="1440" fill="url(#bg)"/>
  <circle cx="930" cy="150" r="210" fill="#b84a2d" opacity=".12"/>
  <circle cx="130" cy="1290" r="260" fill="#2e4a3f" opacity=".10"/>
  <rect x="76" y="84" width="928" height="1272" rx="56" fill="#fffaf2" opacity=".88" filter="url(#softShadow)"/>
  <text x="128" y="172" fill="#b84a2d" font-size="34" font-weight="700" font-family="PingFang SC, Noto Sans SC, sans-serif" letter-spacing="3">${escapeXml(card.eyebrow || 'NOTE')}</text>
${svgTextLines(titleLines, 128, titleY, 74, 78, '#221914', 800)}
${svgBodyLines(bodyLines, 128, bodyY)}
${calloutLines.length ? svgCallout(calloutLines, 128, 1120) : ''}
  <text x="128" y="1278" fill="#7c6b5d" font-size="28" font-family="PingFang SC, Noto Sans SC, sans-serif">yolobbx.github.io</text>
  <text x="904" y="1278" fill="#7c6b5d" font-size="28" font-family="JetBrains Mono, Menlo, monospace">${page}/${total}</text>
</svg>
`;
}

function svgBodyLines(lines, x, y) {
  return lines.map((line, index) => {
    const bullet = lines.length > 1 ? `<tspan fill="#b84a2d">• </tspan>` : '';
    return `  <text x="${x}" y="${y + index * 58}" fill="#3f332c" font-size="38" font-family="PingFang SC, Noto Sans SC, sans-serif">${bullet}${escapeXml(line)}</text>`;
  }).join('\n');
}

function svgCallout(lines, x, y) {
  const text = lines.map((line, index) => `<text x="${x + 34}" y="${y + 60 + index * 46}" fill="#4c372c" font-size="31" font-family="PingFang SC, Noto Sans SC, sans-serif">${escapeXml(line)}</text>`).join('\n');
  return `  <rect x="${x}" y="${y}" width="824" height="${120 + lines.length * 46}" rx="28" fill="#f2dcc5"/>
${text}`;
}

function svgTextLines(lines, x, y, fontSize, lineHeight, color, weight) {
  return lines.map((line, index) => `<text x="${x}" y="${y + index * lineHeight}" fill="${color}" font-size="${fontSize}" font-weight="${weight}" font-family="PingFang SC, Noto Sans SC, sans-serif">${escapeXml(line)}</text>`).join('\n');
}

function renderInlineHtml(text) {
  return escapeHtml(text)
    .replace(/`([^`]+)`/g, '<code style="padding: 2px 5px; background: #f2f2f2; border-radius: 4px; font-size: .92em;">$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" style="color: #B84A2D;">$1</a>');
}

function stripInline(text) {
  return String(text)
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '$1')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .trim();
}

function firstParagraph(blocks) {
  return stripInline(blocks.find((block) => block.type === 'paragraph')?.text || '');
}

function keywordTags(title) {
  const known = [
    ['AI', /ai|agent|claude|codex|karpathy/i],
    ['效率工具', /工具|终端|terminal|code|setup/i],
    ['技术写作', /写作|博客|markdown/i],
  ];
  return known.filter(([, pattern]) => pattern.test(title)).map(([tag]) => tag);
}

function shortTitle(text) {
  const clean = stripInline(text);
  return clean.length > 18 ? `${clean.slice(0, 18)}…` : clean;
}

function wrapText(text, maxUnits) {
  const normalized = stripInline(text).replace(/\s+/g, ' ');
  const lines = [];
  let line = '';
  let units = 0;

  for (const char of normalized) {
    const charUnits = /[\x00-\x7F]/.test(char) ? 0.55 : 1;
    if (units + charUnits > maxUnits && line) {
      lines.push(line.trim());
      line = '';
      units = 0;
    }
    line += char;
    units += charUnits;
  }

  if (line.trim()) lines.push(line.trim());
  return lines;
}

function unique(items) {
  return [...new Set(items)];
}

function slugFromFile(file) {
  const relativePath = path.relative(postsDir, file);
  const parsed = path.parse(relativePath);
  if (parsed.name === 'index') return path.basename(parsed.dir);
  return parsed.name;
}

function relative(file) {
  return path.relative(rootDir, file);
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapeXml(value) {
  return escapeHtml(value).replace(/'/g, '&apos;');
}
