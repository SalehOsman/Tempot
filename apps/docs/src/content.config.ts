import { defineCollection } from 'astro:content';
import { docsLoader, i18nLoader } from '@astrojs/starlight/loaders';
import { docsSchema, i18nSchema } from '@astrojs/starlight/schema';
import { z } from 'astro/zod';

/** Custom frontmatter fields for Tempot documentation pages */
const tempotDocsExtension = z.object({
  tags: z.array(z.string()).optional(),
  audience: z
    .array(z.enum(['package-developer', 'bot-developer', 'operator', 'end-user']))
    .optional(),
  contentType: z.literal('developer-docs').optional(),
  package: z.string().optional(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
});

export const collections = {
  docs: defineCollection({
    loader: docsLoader(),
    schema: docsSchema({ extend: tempotDocsExtension }),
  }),
  i18n: defineCollection({ loader: i18nLoader(), schema: i18nSchema() }),
};
