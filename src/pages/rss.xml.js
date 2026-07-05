import rss from '@astrojs/rss';
import { getAllClippings } from '../lib/clippings';

export async function GET(context) {
	const clippings = await getAllClippings();

	return rss({
		title: 'AI 网摘',
		description: '精选 AI 应用技巧与行业趋势。日刊与周刊，不含学术论文。',
		site: context.site,
		items: clippings.map((clip) => ({
			title: clip.data.title,
			pubDate: clip.data.pubDate,
			description: clip.data.description,
			link: `/clip/${clip.slug}/`,
			categories: clip.data.tags,
		})),
		customData: `<language>zh-cn</language>`,
	});
}
