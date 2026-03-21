import { pgTable, uuid, vector, text, jsonb } from 'drizzle-orm/pg-core';
import { DB_CONFIG } from '../config';

export const embeddings = pgTable('embeddings', {
  id: uuid('id').primaryKey().defaultRandom(),
  contentId: text('content_id').notNull(),
  contentType: text('content_type').notNull(),
  // Vector dimensions: set via config (Default: 768 for Gemini)
  vector: vector('vector', { dimensions: DB_CONFIG.VECTOR_DIMENSIONS }).notNull(),
  metadata: jsonb('metadata'),
});
