#!/usr/bin/env node
/**
 * Fully automated daily clip pipeline:
 * discover → pick top candidate → LLM generate → validate links → optional commit
 *
 * Usage:
 *   node scripts/auto-daily-clip.mjs           # generate only
 *   node scripts/auto-daily-clip.mjs --commit  # generate + git commit (CI)
 */

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { execSync } from 'node:child_process';
import { discover } from './discover-clips.mjs';
import { generateClipForCandidate } from './generate-clip.mjs';
import { todayEdition } from './lib/slug.mjs';

const root = process.cwd();
const clippingsDir = join(root, 'src/content/clippings');
const automation = JSON.parse(readFileSync(join(root, 'config/automation.json'), 'utf8'));
const shouldCommit = process.argv.includes('--commit');

function editionAlreadyPublished(edition) {
	for (const file of readdirSync(clippingsDir).filter((f) => f.endsWith('.md'))) {
		const content = readFileSync(join(clippingsDir, file), 'utf8');
		if (new RegExp(`^edition:\\s*["']?${edition}["']?\\s*$`, 'm').test(content)) {
			return file;
		}
	}
	return null;
}

function pickCandidate(candidates) {
	const priority = ['anthropic-engineering', 'cursor-blog', 'simon-willison', 'saastr', 'openai-blog'];
	for (const id of priority) {
		const hit = candidates.find((c) => c.sourceId === id);
		if (hit) return hit;
	}
	return candidates[0];
}

async function main() {
	const edition = todayEdition(automation.timezone);
	const existing = editionAlreadyPublished(edition);
	if (existing) {
		console.log(`Skip: edition ${edition} already has clip (${existing})`);
		process.exit(0);
	}

	const { candidates, errors } = await discover();
	if (errors.length) {
		console.warn('Discovery warnings:');
		for (const e of errors) console.warn(`- ${e.source}: ${e.message}`);
	}
	if (!candidates.length) {
		console.log('No new candidates from whitelist.');
		process.exit(0);
	}

	const candidate = pickCandidate(candidates);
	console.log(`Selected: [${candidate.source}] ${candidate.title}`);
	console.log(candidate.url);

	const result = await generateClipForCandidate(candidate);
	console.log(`Generated: ${result.path}`);

	execSync('node scripts/check-clipping-links.mjs', { stdio: 'inherit', cwd: root });
	console.log('Link check passed.');

	if (shouldCommit) {
		const msg = `clip: auto daily ${edition} (${result.slug})`;
		execSync(`git add "${result.path}"`, { cwd: root });
		try {
			execSync(`git diff --staged --quiet`, { cwd: root });
			console.log('Nothing to commit.');
		} catch {
			execSync(`git commit -m "${msg}"`, { cwd: root });
			console.log(`Committed: ${msg}`);
		}
	}
}

main().catch((error) => {
	console.error(error instanceof Error ? error.message : error);
	process.exit(1);
});
