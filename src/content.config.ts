import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const posts = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/posts' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    category: z.enum(['ai', 'tools', 'music']),
    author: z.string().default('yolobbx'),
    draft: z.boolean().default(false),
    description: z.string().optional(),
  }),
});

export const collections = { posts };
