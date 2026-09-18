import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import {
	PRIORITY_HEAD,
	buildPriority,
	loadClippingsMeta,
	parseClippingMeta,
	pickCandidate,
	recentSourceIdsFromClippings,
	resolveSourceId,
} from './pick-daily-candidate.mjs';

const root = process.cwd();
const clipSources = JSON.parse(readFileSync(join(root, 'config/clip-sources.json'), 'utf8'));
const priority = buildPriority(clipSources.sources);

function cand(sourceId, title = sourceId) {
	return { sourceId, source: sourceId, title, url: `https://example.com/${sourceId}` };
}

test('PRIORITY ids match clip-sources.json ids', () => {
	const ids = new Set(clipSources.sources.map((s) => s.id));
	for (const id of PRIORITY_HEAD) {
		assert.ok(ids.has(id), `PRIORITY_HEAD id missing from clip-sources.json: ${id}`);
	}
	for (const source of clipSources.sources.filter((s) => s.enabled)) {
		assert.ok(priority.includes(source.id), `enabled source not in built PRIORITY: ${source.id}`);
	}
});

test('resolveSourceId maps frontmatter name and URL host/prefix', () => {
	assert.equal(
		resolveSourceId({ source: 'Simon Willison', url: 'https://simonwillison.net/2026/Sep/17/x' }, clipSources.sources),
		'simon-willison',
	);
	assert.equal(
		resolveSourceId({ source: 'Cursor', url: 'https://cursor.com/blog/projects' }, clipSources.sources),
		'cursor-blog',
	);
	assert.equal(
		resolveSourceId({ source: 'Unknown', url: 'https://huggingface.co/blog/some-post' }, clipSources.sources),
		'huggingface-blog',
	);
	assert.equal(
		resolveSourceId({ url: 'https://www.langchain.com/blog/paid-media-agent' }, clipSources.sources),
		'langchain-blog',
	);
});

test('recent-use demotion beats higher PRIORITY repeats', () => {
	const candidates = [cand('simon-willison'), cand('huggingface-blog'), cand('saastr')];
	const picked = pickCandidate(candidates, new Set(['simon-willison']), priority);
	assert.equal(picked.sourceId, 'huggingface-blog');
});

test('falls back to PRIORITY when every candidate source was recent', () => {
	const candidates = [cand('saastr'), cand('simon-willison')];
	const picked = pickCandidate(candidates, new Set(['saastr', 'simon-willison']), priority);
	assert.equal(picked.sourceId, 'simon-willison');
});

test('parseClippingMeta reads edition + source + url', () => {
	const meta = parseClippingMeta(`---
title: "x"
url: "https://simonwillison.net/2026/Sep/17/targeted-attacks-on-rustaceans"
source: "Simon Willison"
edition: "2026-09-18"
---
`);
	assert.equal(meta.edition, '2026-09-18');
	assert.equal(meta.source, 'Simon Willison');
	assert.equal(meta.url, 'https://simonwillison.net/2026/Sep/17/targeted-attacks-on-rustaceans');
});

test('current history does not auto-pick Simon when alternatives exist', () => {
	const metas = loadClippingsMeta(join(root, 'src/content/clippings'));
	const { ids, editions } = recentSourceIdsFromClippings(metas, clipSources.sources);
	assert.ok(editions.length >= 5, 'expected at least 5 published editions');
	assert.ok(ids.has('simon-willison'), `expected Simon in last 5 editions, got ${[...ids].join(',')}`);

	const candidates = [
		cand('simon-willison', 'Simon latest'),
		cand('huggingface-blog', 'HF latest'),
		cand('github-ai', 'GitHub AI latest'),
		cand('saastr', 'SaaStr latest'),
	];
	const picked = pickCandidate(candidates, ids, priority);
	assert.notEqual(picked.sourceId, 'simon-willison');
	assert.equal(picked.sourceId, 'huggingface-blog');
});
