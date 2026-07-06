#!/usr/bin/env node
/**
 * Discover today's clip candidate and write data/daily-candidate.json.
 * Exits 0 with "SKIP" or "READY" on stdout for CI.
 */

import { writeFileSync, mkdirSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { discover } from './discover-clips.mjs';
import { todayEdition } from './lib/slug.mjs';

const root = process.cwd();
const outDir = join(root, 'data');
const outFile = join(outDir, 'daily-candidate.json');
const automation = JSON.parse(readFileSync(join(root, 'config/automation.json'), 'utf8'));

const PRIORITY = [
	'anthropic-engineering',
	'cursor-blog',
	'simon-willison',
	'saastr',
	'openai-blog',
	'google-ai',
	'cloudflare-ai',
];

function editionAlreadyPublished(edition) {
	const clippingsDir = join(root, 'src/content/clippings');
	for (const file of readdirSync(clippingsDir).filter((f) => f.endsWith('.md'))) {
		const content = readFileSync(join(clippingsDir, file), 'utf8');
		if (new RegExp(`^edition:\\s*["']?${edition}["']?\\s*$`, 'm').test(content)) {
			return file;
		}
	}
	return null;
}

function pickCandidate(candidates) {
	for (const id of PRIORITY) {
		const hit = candidates.find((c) => c.sourceId === id);
		if (hit) return hit;
	}
	return candidates[0];
}

async function main() {
	const edition = todayEdition(automation.timezone);
	const existing = editionAlreadyPublished(edition);
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

	const candidate = {
		...pickCandidate(candidates),
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
