#!/usr/bin/env node
import { writeFileSync, existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { fetchArticleContent, truncateText } from './lib/article-text.mjs';
import { generateClipMarkdown } from './lib/llm.mjs';
import { slugFromUrl, todayEdition } from './lib/slug.mjs';

const root = process.cwd();
const clippingsDir = join(root, 'src/content/clippings');
const automation = JSON.parse(readFileSync(join(root, 'config/automation.json'), 'utf8'));

const SYSTEM_PROMPT = `你是 miguoliang.com「AI 网摘」的编辑。读者是 junior engineer。

输出一篇完整 Markdown 文件（含 YAML frontmatter），要求：
- 仅中文，不要英文对照，不要 ## 导读 / ## 原文
- 金字塔结构：### 结论 → ### 要点 → ### 怎么做 → ### 关键图表
- 结论 2-3 句；要点 3-5 条（加粗判断 + 展开解释）；怎么做是可执行步骤
- 不啰嗦、不重复；一张图说清就不放第二张
- 若提供了可用配图 URL，优先用原图 markdown；否则用一张 mermaid（flowchart/sequence）
- 范围：应用技巧或行业趋势；不要写成学术论文
- 只输出文件正文，不要包在代码块里`;

export async function generateClipForCandidate(candidate) {
	const edition = todayEdition(automation.timezone);
	const article = await fetchArticleContent(candidate.url);
	const text = truncateText(article.text, automation.maxArticleChars ?? 28000);

	const userPrompt = [
		`请为以下文章生成网摘 Markdown 文件。`,
		``,
		`来源：${candidate.source}`,
		`原文 URL：${candidate.url}`,
		`建议标签：${(candidate.tags ?? []).join(', ')}`,
		`日刊 edition：${edition}`,
		`editionType：daily`,
		``,
		`可用配图（如有合适的选一张）：`,
		...(candidate.images?.length ? candidate.images : article.images).map((u) => `- ${u}`),
		``,
		`原文标题：${article.title || candidate.title}`,
		``,
		`原文正文（可能截断）：`,
		text,
		``,
		`frontmatter 必须包含：title, description, url, source, pubDate, edition, editionType, tags, author（可取自来源）`,
		`url 必须是：${candidate.url}`,
	].join('\n');

	const raw = await generateClipMarkdown({ system: SYSTEM_PROMPT, user: userPrompt });
	const markdown = stripCodeFence(raw);
	validateClipMarkdown(markdown, candidate.url);

	const slug = uniqueSlug(slugFromUrl(candidate.url));
	const outPath = join(clippingsDir, `${slug}.md`);
	writeFileSync(outPath, `${markdown.trim()}\n`, 'utf8');

	return { slug, path: outPath, edition };
}

function stripCodeFence(text) {
	const fenced = text.match(/^```(?:markdown|md)?\s*([\s\S]*?)```\s*$/);
	return fenced ? fenced[1].trim() : text.trim();
}

function validateClipMarkdown(markdown, url) {
	if (!markdown.startsWith('---')) throw new Error('Generated clip missing frontmatter');
	for (const section of ['### 结论', '### 要点', '### 怎么做', '### 关键图表']) {
		if (!markdown.includes(section)) throw new Error(`Generated clip missing ${section}`);
	}
	if (markdown.includes('## 导读') || markdown.includes('## 原文')) {
		throw new Error('Generated clip must not include ## 导读 or ## 原文');
	}
	if (!markdown.includes(url)) throw new Error('Generated clip frontmatter url mismatch');
}

function uniqueSlug(base) {
	let slug = base;
	let i = 2;
	while (existsSync(join(clippingsDir, `${slug}.md`))) {
		slug = `${base}-${i++}`;
	}
	return slug;
}

const isMain = import.meta.url === pathToFileURL(resolve(process.argv[1] ?? '')).href;

if (isMain) {
	const url = process.argv[2];
	if (!url) {
		console.error('Usage: node scripts/generate-clip.mjs <url> [--source Name] [--tags tag1,tag2]');
		process.exit(1);
	}
	const candidate = {
		url,
		source: process.argv.includes('--source')
			? process.argv[process.argv.indexOf('--source') + 1]
			: 'Web',
		tags: process.argv.includes('--tags')
			? process.argv[process.argv.indexOf('--tags') + 1].split(',')
			: ['应用技巧'],
		title: '',
	};
	const result = await generateClipForCandidate(candidate);
	console.log(`Wrote ${result.path}`);
}
