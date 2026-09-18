/**
 * Daily clip picker: soft quality order + demote sources used in recent editions.
 */

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

export const RECENT_EDITION_WINDOW = 5;

/**
 * Soft quality preference (must match clip-sources.json `id` / discover `sourceId`).
 * Recent-edition demotion is applied first and beats this order.
 */
export const PRIORITY_HEAD = [
	'anthropic-engineering',
	'cursor-blog',
	'simon-willison',
	'huggingface-blog',
	'vercel-blog',
	'github-ai',
	'langchain-blog',
	'sourcegraph-blog',
	'continue-blog',
	'openai-blog',
	'google-ai',
	'meta-ai',
	'cloudflare-ai',
	'microsoft-agent-framework',
	'microsoft-opensource',
	'latent-space',
	'interconnects',
	'saastr',
	'ai-news',
];

export function buildPriority(sources) {
	const enabled = sources.filter((s) => s.enabled).map((s) => s.id);
	const enabledSet = new Set(enabled);
	const head = PRIORITY_HEAD.filter((id) => enabledSet.has(id));
	const rest = enabled.filter((id) => !PRIORITY_HEAD.includes(id));
	return [...head, ...rest];
}

function hostnameOf(url) {
	try {
		return new URL(url).hostname.replace(/^www\./, '');
	} catch {
		return '';
	}
}

function pathOf(url) {
	try {
		return new URL(url).pathname.replace(/\/$/, '') || '/';
	} catch {
		return '';
	}
}

export function resolveSourceId(clip, sources) {
	const name = clip.source?.trim();
	if (name) {
		const lower = name.toLowerCase();
		const byName = sources.find((s) => s.name.toLowerCase() === lower);
		if (byName) return byName.id;
	}

	const url = clip.url?.trim();
	if (!url) return null;

	let parsed;
	try {
		parsed = new URL(url);
	} catch {
		return null;
	}

	for (const source of sources) {
		if (source.urlPrefix && url.startsWith(source.urlPrefix)) return source.id;
	}

	const host = parsed.hostname.replace(/^www\./, '');
	const path = parsed.pathname;
	let hostMatch = null;
	for (const source of sources) {
		const refs = [source.rss, source.listingUrl, source.urlPrefix].filter(Boolean);
		for (const ref of refs) {
			const refHost = hostnameOf(ref);
			if (!refHost || host !== refHost) continue;
			const refPath = pathOf(ref);
			if (refPath && refPath !== '/' && (path === refPath || path.startsWith(`${refPath}/`))) {
				return source.id;
			}
			hostMatch ??= source.id;
		}
	}
	return hostMatch;
}

export function parseClippingMeta(content, file = '') {
	const edition = content.match(/^edition:\s*["']?([0-9-]+)["']?\s*$/m)?.[1] ?? null;
	const source = content.match(/^source:\s*["']?(.+?)["']?\s*$/m)?.[1]?.trim() ?? null;
	const url = content.match(/^url:\s*["']?(.+?)["']?\s*$/m)?.[1]?.trim() ?? null;
	return { file, edition, source, url };
}

export function loadClippingsMeta(clippingsDir) {
	return readdirSync(clippingsDir)
		.filter((f) => f.endsWith('.md'))
		.map((file) => parseClippingMeta(readFileSync(join(clippingsDir, file), 'utf8'), file));
}

export function recentSourceIdsFromClippings(
	clippings,
	sources,
	window = RECENT_EDITION_WINDOW,
) {
	const editions = [...new Set(clippings.map((c) => c.edition).filter(Boolean))].sort().reverse();
	const recent = new Set(editions.slice(0, window));
	const ids = new Set();
	for (const clip of clippings) {
		if (!recent.has(clip.edition)) continue;
		const id = resolveSourceId(clip, sources);
		if (id) ids.add(id);
	}
	return { ids, editions: [...recent] };
}

/**
 * Prefer a source not used in the last N calendar editions.
 * Among that pool (or all candidates if every source was recent), use PRIORITY.
 * Demotion beats a high-priority repeat such as Simon always sitting third.
 */
export function pickCandidate(candidates, recentSourceIds, priority = PRIORITY_HEAD) {
	if (!candidates.length) return null;
	const recent = recentSourceIds instanceof Set ? recentSourceIds : new Set(recentSourceIds ?? []);
	const unused = candidates.filter((c) => !recent.has(c.sourceId));
	const pool = unused.length ? unused : candidates;
	for (const id of priority) {
		const hit = pool.find((c) => c.sourceId === id);
		if (hit) return hit;
	}
	return pool[0];
}
