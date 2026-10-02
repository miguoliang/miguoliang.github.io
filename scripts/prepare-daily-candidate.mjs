#!/usr/bin/env node
/**
 * Discover today's clip candidate and write data/daily-candidate.json.
 * From 2026-10-03 the daily must be an application story, not specialist infra.
 * Exits 0 with "SKIP" or "READY" on stdout for CI.
 */

import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { discover } from './discover-clips.mjs';
import { todayEdition } from './lib/slug.mjs';
import { fetchArticleContent } from './lib/article-text.mjs';
import {
	TOPIC_APPLICATION,
	TOPIC_INFRA,
	classifyClipTopic,
	topicHaystack,
} from './lib/clip-topic.mjs';
import {
	buildPriority,
	loadClippingsMeta,
	pickVerifiedCandidate,
	recentSourceIdsFromClippings,
} from './lib/pick-daily-candidate.mjs';

const root = process.cwd();
const outDir = join(root, 'data');
const outFile = join(outDir, 'daily-candidate.json');
const automation = JSON.parse(readFileSync(join(root, 'config/automation.json'), 'utf8'));
const clipSources = JSON.parse(readFileSync(join(root, 'config/clip-sources.json'), 'utf8'));
const PRIORITY = buildPriority(clipSources.sources);
const clippingsDir = join(root, 'src/content/clippings');

function editionAlreadyPublished(edition, metas) {
	return metas.find((m) => m.edition === edition)?.file ?? null;
}

async function verifyTopic(candidate) {
	const fromMeta = classifyClipTopic(topicHaystack(candidate));
	if (fromMeta === TOPIC_INFRA || fromMeta === TOPIC_APPLICATION) return fromMeta;
	try {
		const article = await fetchArticleContent(candidate.url);
		return classifyClipTopic(
			[candidate.title, candidate.url, candidate.description, article.title, article.text.slice(0, 5000)]
				.filter(Boolean)
				.join('\n'),
		);
	} catch (error) {
		const message = error instanceof Error ? error.message : error;
		console.warn(`WARN: topic fetch failed (${candidate.url}): ${message}`);
		return fromMeta;
	}
}

async function main() {
	const edition = todayEdition(automation.timezone);
	const metas = loadClippingsMeta(clippingsDir);
	const existing = editionAlreadyPublished(edition, metas);
	if (existing) {
		console.log(`SKIP: edition ${edition} already published (${existing})`);
		return;
	}

	const { candidates, errors } = await discover();
	if (errors.length) {
		for (const e of errors) console.warn(`WARN: ${e.source}: ${e.message}`);
	}
	if (!candidates.length) {
		console.log('SKIP: no new whitelist candidates');
		return;
	}

	const { ids: recentSourceIds } = recentSourceIdsFromClippings(metas, clipSources.sources);
	const picked = await pickVerifiedCandidate(candidates, recentSourceIds, PRIORITY, verifyTopic);
	if (!picked) {
		console.log('SKIP: no application-story candidate (infra/theory filtered)');
		return;
	}

	const topic = classifyClipTopic(topicHaystack(picked));
	const candidate = {
		...picked,
		topic,
		edition,
		editionType: 'daily',
		preparedAt: new Date().toISOString(),
	};

	mkdirSync(outDir, { recursive: true });
	writeFileSync(outFile, `${JSON.stringify(candidate, null, 2)}\n`, 'utf8');
	console.log('READY');
	console.log(`Candidate: [${candidate.source}] ${candidate.title}`);
	console.log(candidate.url);
	if (topic !== TOPIC_APPLICATION) {
		console.warn(
			'WARN: title/url did not look like an application story; writer must confirm before publishing',
		);
	}
}

main().catch((error) => {
	console.error(error instanceof Error ? error.message : error);
	process.exit(1);
});
