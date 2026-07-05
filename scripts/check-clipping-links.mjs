import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const clippingsDir = join(process.cwd(), 'src/content/clippings');
const files = readdirSync(clippingsDir).filter((file) => file.endsWith('.md'));

const failures = [];

for (const file of files) {
	const content = readFileSync(join(clippingsDir, file), 'utf8');
	const match = content.match(/^url:\s*"(.+)"\s*$/m);

	if (!match) {
		failures.push(`${file}: missing url in frontmatter`);
		continue;
	}

	const url = match[1];

	try {
		const response = await fetch(url, {
			method: 'GET',
			redirect: 'follow',
			headers: { 'User-Agent': 'miguoliang-site-link-check/1.0' },
		});

		if (!response.ok) {
			failures.push(`${file}: ${response.status} ${url}`);
		} else {
			console.log(`OK ${file} -> ${url}`);
		}
	} catch (error) {
		failures.push(`${file}: ${error instanceof Error ? error.message : String(error)} (${url})`);
	}
}

if (failures.length > 0) {
	console.error('\nInvalid clipping links:');
	for (const failure of failures) {
		console.error(`- ${failure}`);
	}
	process.exit(1);
}

console.log(`\nAll ${files.length} clipping links are reachable.`);
