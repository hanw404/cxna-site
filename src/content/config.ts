import { defineCollection, z } from 'astro:content';

const labnotes = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    project: z.enum(['A', 'B', 'both']),
    type: z.enum(['wet-lab', 'dry-lab']),
    status: z.enum(['confirmed', 'in-progress', 'pending']),
  }),
});

export const collections = { labnotes };
