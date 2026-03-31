import { pgTable, uuid, vector, text, jsonb, index } from 'drizzle-orm/pg-core';
import { DB_CONFIG } from '../database.config.js';

export const embeddings = pgTable(
  'embeddings',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    contentId: text('content_id').notNull(),
    contentType: text('content_type').notNull(),
    // Vector dimensions: set via config (Default: 768 for Gemini)
    vector: vector('vector', { dimensions: DB_CONFIG.VECTOR_DIMENSIONS }).notNull(),
    metadata: jsonb('metadata'),
  },
  (table) => [
    // HNSW index for cosine similarity search (ADR-003, ADR-017)
    index('embeddings_vector_hnsw_idx').using('hnsw', table.vector.op('vector_cosine_ops')),
  ],
);
