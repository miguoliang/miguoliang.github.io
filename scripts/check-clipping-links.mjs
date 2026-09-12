import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const clippingsDir = join(process.cwd(), 'src/content/clippings');
const files = readdirSync(clippingsDir).filter((file) => file.endsWith('.md'));
const MAX_ATTEMPTS = 3;

const failures = [];
const warnings = [];

function isTransientStatus(status) {
	return status === 429 || status >= 500;
}

function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry(url) {
	let lastError;

	for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
		try {
			const response = await fetch(url, {
				method: 'GET',
				redirect: 'follow',
				headers: { 'User-Agent': 'miguoliang-site-link-check/1.0' },
			});
			if (response.ok || !isTransientStatus(response.status) || attempt === MAX_ATTEMPTS) {
				return response;
			}
			lastError = new Error(`${response.status}`);
		} catch (error) {
			lastError = error;
			if (attempt === MAX_ATTEMPTS) throw error;
		}
		await sleep(400 * attempt);
	}

	throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

for (const file of files) {
	const content = readFileSync(join(clippingsDir, file), 'utf8');
	const match = content.match(/^url:\s*"(.+)"\s*$/m);

	if (!match) {
		failures.push(`${file}: missing url in frontmatter`);
		continue;
	}

	const url = match[1];

	try {
		const response = await fetchWithRetry(url);

		if (response.ok) {
			console.log(`OK ${file} -> ${url}`);
		} else if (isTransientStatus(response.status)) {
			warnings.push(`${file}: ${response.status} ${url}`);
			console.warn(`WARN ${file}: ${response.status} ${url}`);
		} else {
			failures.push(`${file}: ${response.status} ${url}`);
		}
	} catch (error) {
		failures.push(`${file}: ${error instanceof Error ? error.message : String(error)} (${url})`);
	}
}

if (warnings.length) {
	console.warn(`\nTransient clipping link warnings (${warnings.length}):`);
	for (const warning of warnings) console.warn(`- ${warning}`);
}

if (failures.length > 0) {
	console.error('\nInvalid clipping links:');
	for (const failure of failures) {
		console.error(`- ${failure}`);
	}
	process.exit(1);
}

console.log(`\nAll ${files.length} clipping links passed (${warnings.length} transient warnings).`);
