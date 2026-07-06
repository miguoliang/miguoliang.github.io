const NOISE_IMG = /(?:icon|logo|favicon|avatar|sprite|pixel|badge|emoji|1x1)/i;

export async function fetchArticleContent(url) {
	const response = await fetch(url, {
		headers: {
			'User-Agent': 'miguoliang-site-clip-bot/1.0',
			Accept: 'text/html,application/xhtml+xml',
		},
		redirect: 'follow',
	});
	if (!response.ok) {
		throw new Error(`Failed to fetch article: ${response.status} ${url}`);
	}

	const html = await response.text();
	const title =
		decode(html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i)?.[1] ??
			html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ??
			'') || 'Untitled';

	const text = htmlToText(html);
	const images = extractImages(html, url).slice(0, 6);

	return { title, text, images, htmlLength: html.length };
}

function decode(text) {
	return text
		.replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
		.replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)))
		.replace(/&amp;/g, '&')
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&quot;/g, '"')
		.trim();
}

function htmlToText(html) {
	let body = html
		.replace(/<script[\s\S]*?<\/script>/gi, ' ')
		.replace(/<style[\s\S]*?<\/style>/gi, ' ')
		.replace(/<nav[\s\S]*?<\/nav>/gi, ' ')
		.replace(/<footer[\s\S]*?<\/footer>/gi, ' ')
		.replace(/<header[\s\S]*?<\/header>/gi, ' ');

	body = body.replace(/<\/(p|div|h[1-6]|li|br|section|article)>/gi, '\n');
	body = body.replace(/<[^>]+>/g, ' ');
	body = decode(body)
		.replace(/\s+\n/g, '\n')
		.replace(/[ \t]{2,}/g, ' ')
		.replace(/\n{3,}/g, '\n\n')
		.trim();

	return body;
}

function extractImages(html, pageUrl) {
	const base = new URL(pageUrl);
	const urls = new Set();

	for (const match of html.matchAll(/<img[^>]+src=["']([^"']+)["']/gi)) {
		try {
			const src = new URL(match[1], base).toString();
			if (!NOISE_IMG.test(src) && /\.(png|jpe?g|webp|svg)/i.test(src)) {
				urls.add(src);
			}
		} catch {
			/* skip invalid */
		}
	}

	return [...urls];
}

export function truncateText(text, maxChars) {
	if (text.length <= maxChars) return text;
	return `${text.slice(0, maxChars)}\n\n[…正文已截断…]`;
}
