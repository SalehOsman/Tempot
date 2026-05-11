import { z } from 'zod';
import { templateContentSchema } from './template-content.schema.js';

export const templateBundleSchema = z.object({
  $schema: z.literal('tempot-template-bundle/1.0'),
  metadata: z.object({
    name: z.string().min(1).max(255),
    description: z.string().min(1).max(5000),
    category: z.string().optional(),
    tags: z.array(z.string().max(100)).max(20).optional(),
    language: z.string().min(2).max(10),
    version: z.string().min(1).max(20),
  }),
  content: templateContentSchema,
  exportedAt: z.string().datetime(),
  exportedBy: z.string().min(1),
  tempotVersion: z.string().min(1),
});

export type TemplateBundleSchemaInput = z.infer<typeof templateBundleSchema>;
