export type ClippingBody = {
	digest: string;
	article: string;
};

const ARTICLE_HEADING = /^##\s*(?:正文|译文)\s*$/m;

export function splitClippingBody(body: string): ClippingBody {
	const parts = body.split(ARTICLE_HEADING);
	const beforeArticle = parts[0] ?? '';
	const afterHeading = parts.slice(1).join('\n');

	const digest = beforeArticle
		.replace(/^##\s*(?:导读|摘要)\s*$/m, '')
		.trim();

	// Drop legacy English section if still present in old content
	const article = afterHeading.split(/^##\s*原文\s*$/m)[0]?.trim() ?? '';

	return { digest, article };
}
