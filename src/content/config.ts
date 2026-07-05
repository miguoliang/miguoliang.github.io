import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
	type: 'content',
	schema: z.object({
		title: z.string(),
		description: z.string(),
		pubDate: z.coerce.date(),
		updatedDate: z.coerce.date().optional(),
		author: z.string().default('You'),
		image: z.string().optional(),
		tags: z.array(z.string()).default([]),
	}),
});

const clippings = defineCollection({
	type: 'content',
	schema: z.object({
		title: z.string(),
		description: z.string(),
		url: z.string().url(),
		source: z.string().optional(),
		pubDate: z.coerce.date(),
		edition: z.string(),
		editionType: z.enum(['daily', 'weekly']),
		tags: z.array(z.string()).default([]),
		author: z.string().optional(),
	}),
});

export const collections = {
	blog,
	clippings,
};
