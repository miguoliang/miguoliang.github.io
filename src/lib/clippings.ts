import { getCollection, type CollectionEntry } from 'astro:content';

export type Clipping = CollectionEntry<'clippings'>;

export async function getAllClippings(): Promise<Clipping[]> {
	const clippings = await getCollection('clippings');
	return clippings.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
}

export type EditionGroup = {
	edition: string;
	items: Clipping[];
	latestDate: Date;
};

/** Sort key for edition identifiers (newer editions sort higher). */
export function editionSortKey(edition: string): number {
	return new Date(`${edition}T12:00:00`).getTime();
}

export function compareEditionGroups(a: EditionGroup, b: EditionGroup): number {
	return editionSortKey(b.edition) - editionSortKey(a.edition);
}

export function groupByEdition(clippings: Clipping[]): EditionGroup[] {
	const groups = new Map<string, Clipping[]>();

	for (const clip of clippings) {
		const existing = groups.get(clip.data.edition) ?? [];
		existing.push(clip);
		groups.set(clip.data.edition, existing);
	}

	return [...groups.entries()]
		.map(([edition, items]) => {
			const sorted = items.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
			return {
				edition,
				items: sorted,
				latestDate: sorted[0].data.pubDate,
			};
		})
		.sort(compareEditionGroups);
}

export function formatEditionTitle(edition: string): string {
	const date = new Date(`${edition}T12:00:00`);
	return `AI 日刊 · ${date.toLocaleDateString('zh-CN', {
		year: 'numeric',
		month: 'long',
		day: 'numeric',
	})}`;
}

export function editionPath(edition: string): string {
	return `/daily/${edition}`;
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
