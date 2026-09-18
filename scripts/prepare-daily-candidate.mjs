#!/usr/bin/env node
/**
 * Discover today's clip candidate and write data/daily-candidate.json.
 * Exits 0 with "SKIP" or "READY" on stdout for CI.
 */

import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { discover } from './discover-clips.mjs';
import { todayEdition } from './lib/slug.mjs';
import {
	buildPriority,
	loadClippingsMeta,
	pickCandidate,
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
	// Prefer unused sources in the last 5 editions; PRIORITY is a soft tie-break only.
	const picked = pickCandidate(candidates, recentSourceIds, PRIORITY);
	const candidate = {
		...picked,
		edition,
		editionType: 'daily',
		preparedAt: new Date().toISOString(),
	};

	mkdirSync(outDir, { recursive: true });
	writeFileSync(outFile, `${JSON.stringify(candidate, null, 2)}\n`, 'utf8');
	console.log('READY');
	console.log(`Candidate: [${candidate.source}] ${candidate.title}`);
	console.log(candidate.url);
}

main().catch((error) => {
	console.error(error instanceof Error ? error.message : error);
	process.exit(1);
});
