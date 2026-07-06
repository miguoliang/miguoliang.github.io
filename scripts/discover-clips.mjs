#!/usr/bin/env node
/**
 * Discover candidate articles from whitelisted RSS feeds / listing pages.
 * Usage:
 *   node scripts/discover-clips.mjs           # human summary to stdout
 *   node scripts/discover-clips.mjs --json    # JSON array
 *   node scripts/discover-clips.mjs --markdown # markdown list (for GitHub Issue)
 */

import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const root = process.cwd();
const configPath = join(root, 'config/clip-sources.json');
const clippingsDir = join(root, 'src/content/clippings');

const config = JSON.parse(readFileSync(configPath, 'utf8'));
const format = process.argv.includes('--json')
	? 'json'
	: process.argv.includes('--markdown')
		? 'markdown'
		: 'text';

function loadExistingUrls() {
	const urls = new Set();
	for (const file of readdirSync(clippingsDir).filter((f) => f.endsWith('.md'))) {
		const content = readFileSync(join(clippingsDir, file), 'utf8');
		const match = content.match(/^url:\s*"(.+)"\s*$/m);
		if (match) urls.add(normalizeUrl(match[1]));
	}
	return urls;
}

function normalizeUrl(url) {
	try {
		const u = new URL(url);
		u.hash = '';
		if (u.pathname.endsWith('/')) u.pathname = u.pathname.slice(0, -1);
		return u.toString();
	} catch {
		return url.trim();
	}
}

function decodeEntities(text) {
	return text
		.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
		.replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
		.replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
		.replace(/&amp;/g, '&')
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'")
		.replace(/&apos;/g, "'")
		.replace(/<[^>]+>/g, '')
		.trim();
}

function matchesPattern(text, patterns) {
	const lower = text.toLowerCase();
	return patterns.some((p) => lower.includes(p.toLowerCase()));
}

function isExcluded(item) {
	if (matchesPattern(item.url, config.excludeUrlPatterns)) return true;
	if (matchesPattern(item.title, config.excludeTitlePatterns)) return true;
	return false;
}

function parseRssItems(xml, source) {
	const items = [];
	const isAtom = xml.includes('<feed') && xml.includes('xmlns="http://www.w3.org/2005/Atom"');

	if (isAtom) {
		const entries = xml.match(/<entry[\s\S]*?<\/entry>/g) ?? [];
		for (const entry of entries) {
			const title = decodeEntities(entry.match(/<title[^>]*>([\s\S]*?)<\/title>/)?.[1] ?? '');
			let url =
				entry.match(/<link[^>]*href="([^"]+)"/)?.[1] ??
				entry.match(/<id[^>]*>([\s\S]*?)<\/id>/)?.[1] ??
				'';
			const date =
				entry.match(/<published[^>]*>([\s\S]*?)<\/published>/)?.[1] ??
				entry.match(/<updated[^>]*>([\s\S]*?)<\/updated>/)?.[1] ??
				'';
			if (title && url) items.push({ title, url, date, source });
		}
	} else {
		const blocks = xml.match(/<item[\s\S]*?<\/item>/g) ?? [];
		for (const block of blocks) {
			const title = decodeEntities(block.match(/<title[^>]*>([\s\S]*?)<\/title>/)?.[1] ?? '');
			const url = decodeEntities(
				block.match(/<link[^>]*>([\s\S]*?)<\/link>/)?.[1] ??
					block.match(/<guid[^>]*>([\s\S]*?)<\/guid>/)?.[1] ??
					'',
			);
			const date = block.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/)?.[1] ?? '';
			if (title && url) items.push({ title, url, date, source });
		}
	}

	return items;
}

async function fetchListingItems(source) {
	const response = await fetch(source.listingUrl, {
		headers: { 'User-Agent': 'miguoliang-site-discover/1.0' },
		redirect: 'follow',
	});
	if (!response.ok) throw new Error(`${response.status} ${source.listingUrl}`);

	const base = new URL(source.listingUrl);
	const html = await response.text();
	const pathPrefix = new URL(source.urlPrefix).pathname;
	const seen = new Set();
	const items = [];

	const hrefPattern = new RegExp(
		`href="((?:${source.urlPrefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}|${pathPrefix}[^"#?]+))"`,
		'g',
	);

	for (const match of html.matchAll(hrefPattern)) {
		const url = normalizeUrl(new URL(match[1], base).toString());
		if (seen.has(url) || url.endsWith('/engineering') || url.endsWith('/blog')) continue;
		if (url.includes('/topic/')) continue;
		seen.add(url);
		const slug = url.split('/').filter(Boolean).pop() ?? 'article';
		const title = slug.replace(/-/g, ' ');
		items.push({ title, url, date: '', source, listOrder: items.length });
	}

	return items.slice(0, config.maxPerSource).map((item, index) => ({
		...item,
		date: item.date || new Date(Date.now() - index * 3_600_000).toISOString(),
	}));
}

async function fetchRssItems(source) {
	const response = await fetch(source.rss, {
		headers: { 'User-Agent': 'miguoliang-site-discover/1.0' },
		redirect: 'follow',
	});
	if (!response.ok) throw new Error(`${response.status} ${source.rss}`);

	const xml = await response.text();
	return parseRssItems(xml, source).slice(0, config.maxPerSource * 2);
}

function withinLookback(dateStr) {
	if (!dateStr) return true;
	const parsed = new Date(dateStr);
	if (Number.isNaN(parsed.getTime())) return true;
	const cutoff = Date.now() - config.lookbackDays * 24 * 60 * 60 * 1000;
	return parsed.getTime() >= cutoff;
}

export async function discover() {
	const existing = loadExistingUrls();
	const candidates = [];
	const errors = [];

	for (const source of config.sources.filter((s) => s.enabled)) {
		try {
			const raw = source.rss ? await fetchRssItems(source) : await fetchListingItems(source);
			let added = 0;
			for (const item of raw) {
				if (added >= config.maxPerSource) break;
				const url = normalizeUrl(item.url);
				if (existing.has(url)) continue;
				if (!withinLookback(item.date)) continue;
				if (isExcluded({ ...item, url })) continue;
				candidates.push({
					title: item.title,
					url,
					date: item.date || null,
					listOrder: item.listOrder ?? 999,
					source: source.name,
					sourceId: source.id,
					tags: source.tags ?? [],
					note: source.note ?? null,
				});
				added++;
			}
		} catch (error) {
			errors.push({
				source: source.name,
				message: error instanceof Error ? error.message : String(error),
			});
		}
	}

	candidates.sort((a, b) => {
		const da = a.date ? new Date(a.date).getTime() : 0;
		const db = b.date ? new Date(b.date).getTime() : 0;
		if (da !== db) return db - da;
		return a.listOrder - b.listOrder;
	});

	return {
		candidates: candidates.slice(0, config.maxTotal),
		errors,
		existingCount: existing.size,
	};
}

function formatText(result) {
	const lines = [];
	lines.push(`已有网摘 ${result.existingCount} 篇 URL`);
	lines.push(`候选 ${result.candidates.length} 篇（近 ${config.lookbackDays} 天，白名单源）\n`);

	for (const c of result.candidates) {
		lines.push(`- [${c.source}] ${c.title}`);
		lines.push(`  ${c.url}`);
		if (c.tags.length) lines.push(`  tags: ${c.tags.join(', ')}`);
	}

	if (result.errors.length) {
		lines.push('\n抓取失败:');
		for (const e of result.errors) lines.push(`- ${e.source}: ${e.message}`);
	}

	return lines.join('\n');
}

function formatMarkdown(result) {
	const today = new Date().toISOString().slice(0, 10);
	const lines = [
		`## AI 网摘候选 · ${today}`,
		'',
		`白名单发现 **${result.candidates.length}** 篇新文章（近 ${config.lookbackDays} 天，已排除已有 URL）。`,
		'',
		'在 GitHub Actions 全自动流水线中会直接生成网摘；本地可 `npm run auto:clip` 试跑（需 API Key）。',
		'',
	];

	if (!result.candidates.length) {
		lines.push('_今日无新候选。可检查 `config/clip-sources.json` 或手动 `workflow_dispatch` 重跑。_');
	} else {
		for (const [i, c] of result.candidates.entries()) {
			lines.push(`### ${i + 1}. ${c.title}`);
			lines.push(`- **来源**：${c.source}`);
			lines.push(`- **链接**：${c.url}`);
			if (c.date) lines.push(`- **发布**：${c.date}`);
			if (c.tags.length) lines.push(`- **建议标签**：${c.tags.join(', ')}`);
			if (c.note) lines.push(`- **备注**：${c.note}`);
			lines.push('');
		}
	}

	if (result.errors.length) {
		lines.push('### 抓取异常');
		for (const e of result.errors) lines.push(`- ${e.source}: ${e.message}`);
	}

	lines.push('');
	lines.push('---');
	lines.push('编辑白名单：`config/clip-sources.json` · 本地预览：`npm run discover:clips`');

	return lines.join('\n');
}

const isMain = import.meta.url === pathToFileURL(resolve(process.argv[1] ?? '')).href;

if (isMain) {
	const result = await discover();

	if (format === 'json') {
		console.log(JSON.stringify(result, null, 2));
	} else if (format === 'markdown') {
		console.log(formatMarkdown(result));
	} else {
		console.log(formatText(result));
		process.exit(result.candidates.length ? 0 : 0);
	}
}
