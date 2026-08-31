type StructuredDataType = 'Article' | 'CollectionPage';

type ArticleJsonLdInput = {
	title: string;
	description: string;
	url: string;
	pubDate: Date;
	updatedDate?: Date;
	author?: string;
	tags?: string[];
	siteUrl: string | URL;
	image?: string;
	type?: StructuredDataType;
};

export function buildArticleJsonLd({
	title,
	description,
	url,
	pubDate,
	updatedDate,
	author,
	tags,
	siteUrl,
	image,
	type = 'Article',
}: ArticleJsonLdInput) {
	const site = String(siteUrl);
	const data: Record<string, unknown> = {
		'@context': 'https://schema.org',
		'@type': type,
		headline: title,
		name: title,
		description,
		datePublished: pubDate.toISOString(),
		url,
		inLanguage: 'zh-CN',
		mainEntityOfPage: {
			'@type': 'WebPage',
			'@id': url,
		},
		publisher: {
			'@type': 'Organization',
			name: 'AI 网摘',
			url: site,
		},
	};

	if (updatedDate) {
		data.dateModified = updatedDate.toISOString();
	}

	if (author) {
		data.author = { '@type': 'Person', name: author };
	}

	if (tags?.length) {
		data.keywords = tags.join(', ');
	}

	if (image) {
		data.image = image;
	}

	return data;
}
