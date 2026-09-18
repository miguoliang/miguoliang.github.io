import assert from 'node:assert/strict';
import { test } from 'node:test';
import { selectBySourceRoundRobin } from './discover-clips.mjs';

test('selectBySourceRoundRobin keeps one item per source before repeats', () => {
	const candidates = [
		{ sourceId: 'vercel-blog', title: 'v1', date: '2026-09-18T12:00:00Z', listOrder: 0 },
		{ sourceId: 'vercel-blog', title: 'v2', date: '2026-09-18T11:00:00Z', listOrder: 1 },
		{ sourceId: 'vercel-blog', title: 'v3', date: '2026-09-18T10:00:00Z', listOrder: 2 },
		{ sourceId: 'simon-willison', title: 's1', date: '2026-09-17T12:00:00Z', listOrder: 999 },
		{ sourceId: 'huggingface-blog', title: 'h1', date: '2026-09-16T12:00:00Z', listOrder: 999 },
	];
	const selected = selectBySourceRoundRobin(candidates, 4);
	assert.deepEqual(
		selected.map((c) => `${c.sourceId}:${c.title}`),
		['vercel-blog:v1', 'simon-willison:s1', 'huggingface-blog:h1', 'vercel-blog:v2'],
	);
});
