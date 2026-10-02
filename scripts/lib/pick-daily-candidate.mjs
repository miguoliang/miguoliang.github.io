/**
 * Daily clip picker: application stories first, then unused sources, then PRIORITY.
 * Specialist infrastructure is never the daily main clipping (from 2026-10-03).
 */

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { TOPIC_APPLICATION, TOPIC_INFRA, classifyClipTopic, topicHaystack } from './clip-topic.mjs';

export const RECENT_EDITION_WINDOW = 5;

/**
 * Soft quality preference (must match clip-sources.json `id` / discover `sourceId`).
 * Topic policy (application vs infra) is applied first; unused-source demotion
 * then beats this order inside each topic group.
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

function asRecentSet(recentSourceIds) {
	return recentSourceIds instanceof Set ? recentSourceIds : new Set(recentSourceIds ?? []);
}

function sortGroupByPriority(items, priority) {
	const ordered = [];
	const seen = new Set();
	for (const id of priority) {
		for (const item of items) {
			if (item.sourceId === id && !seen.has(item)) {
				ordered.push(item);
				seen.add(item);
			}
		}
	}
	for (const item of items) {
		if (!seen.has(item)) ordered.push(item);
	}
	return ordered;
}

function splitUnusedThenRecent(items, recent) {
	const unused = items.filter((c) => !recent.has(c.sourceId));
	const used = items.filter((c) => recent.has(c.sourceId));
	if (!unused.length) return [items];
	return used.length ? [unused, used] : [unused];
}

/**
 * Rank for the daily: drop specialist infra, prefer application stories,
 * then unused sources in the last N editions, then PRIORITY.
 */
export function rankCandidates(candidates, recentSourceIds, priority = PRIORITY_HEAD) {
	if (!candidates.length) return [];
	const recent = asRecentSet(recentSourceIds);
	const notInfra = candidates.filter(
		(c) => classifyClipTopic(topicHaystack(c)) !== TOPIC_INFRA,
	);
	const application = notInfra.filter(
		(c) => classifyClipTopic(topicHaystack(c)) === TOPIC_APPLICATION,
	);
	const unknown = notInfra.filter(
		(c) => classifyClipTopic(topicHaystack(c)) !== TOPIC_APPLICATION,
	);

	const groups = [];
	if (application.length) groups.push(...splitUnusedThenRecent(application, recent));
	if (unknown.length) groups.push(...splitUnusedThenRecent(unknown, recent));

	const ranked = [];
	for (const group of groups) {
		ranked.push(...sortGroupByPriority(group, priority));
	}
	return ranked;
}

/**
 * Prefer an application story not used in the last N calendar editions.
 * Infra/theory titles are dropped. If nothing remains, return null (caller SKIPs).
 */
export function pickCandidate(candidates, recentSourceIds, priority = PRIORITY_HEAD) {
	return rankCandidates(candidates, recentSourceIds, priority)[0] ?? null;
}

/**
 * After title/url ranking, `verifyTopic(candidate)` may fetch the article.
 * Drop infra; take the first application story; otherwise the first remaining unknown.
 */
export async function pickVerifiedCandidate(
	candidates,
	recentSourceIds,
	priority = PRIORITY_HEAD,
	verifyTopic = async (candidate) => classifyClipTopic(topicHaystack(candidate)),
) {
	const ranked = rankCandidates(candidates, recentSourceIds, priority);
	let unknownFallback = null;
	for (const candidate of ranked) {
		const topic = await verifyTopic(candidate);
		if (topic === TOPIC_INFRA) continue;
		if (topic === TOPIC_APPLICATION) return candidate;
		unknownFallback ??= candidate;
	}
	return unknownFallback;
}
