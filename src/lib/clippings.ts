import { getCollection, type CollectionEntry } from 'astro:content';

export type Clipping = CollectionEntry<'clippings'>;
export type EditionType = Clipping['data']['editionType'];

export async function getAllClippings(): Promise<Clipping[]> {
	const clippings = await getCollection('clippings');
	return clippings.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
}

export async function getClippingsByType(type: EditionType): Promise<Clipping[]> {
	return (await getAllClippings()).filter((clip) => clip.data.editionType === type);
}

export type EditionGroup = {
	edition: string;
	type: EditionType;
	items: Clipping[];
	latestDate: Date;
};

export function groupByEdition(clippings: Clipping[]): EditionGroup[] {
	const groups = new Map<string, Clipping[]>();

	for (const clip of clippings) {
		const key = `${clip.data.editionType}:${clip.data.edition}`;
		const existing = groups.get(key) ?? [];
		existing.push(clip);
		groups.set(key, existing);
	}

	return [...groups.entries()]
		.map(([key, items]) => {
			const type = items[0].data.editionType;
			const edition = items[0].data.edition;
			const sorted = items.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
			return {
				edition,
				type,
				items: sorted,
				latestDate: sorted[0].data.pubDate,
			};
		})
		.sort((a, b) => b.latestDate.valueOf() - a.latestDate.valueOf());
}

export function getEditionsByType(groups: EditionGroup[], type: EditionType): EditionGroup[] {
	return groups.filter((group) => group.type === type);
}

export function formatEditionTitle(edition: string, type: EditionType): string {
	if (type === 'daily') {
		const date = new Date(`${edition}T12:00:00`);
		return `AI 日刊 · ${date.toLocaleDateString('zh-CN', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
		})}`;
	}

	const match = edition.match(/^(\d{4})-w(\d{1,2})$/i);
	if (match) {
		return `AI 周刊 · ${match[1]} 年第 ${Number(match[2])} 周`;
	}

	return `AI 周刊 · ${edition}`;
}

export function editionPath(type: EditionType, edition: string): string {
	return type === 'daily' ? `/daily/${edition}` : `/weekly/${edition}`;
}

export type TagEntry = {
	name: string;
	slug: string;
	count: number;
};

export function getAllTags(clippings: Clipping[]): TagEntry[] {
	const counts = new Map<string, number>();

	for (const clip of clippings) {
		for (const tag of clip.data.tags) {
			counts.set(tag, (counts.get(tag) ?? 0) + 1);
		}
	}

	return [...counts.entries()]
		.map(([name, count]) => ({
			name,
			slug: tagToSlug(name),
			count,
		}))
		.sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'zh-CN'));
}

export function tagToSlug(tag: string): string {
	return encodeURIComponent(tag);
}

export function slugToTag(slug: string): string {
	return decodeURIComponent(slug);
}

export function getClippingsByTag(clippings: Clipping[], tag: string): Clipping[] {
	return clippings.filter((clip) => clip.data.tags.includes(tag));
}
