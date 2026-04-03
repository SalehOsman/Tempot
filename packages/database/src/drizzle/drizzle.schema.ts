import { sql } from 'drizzle-orm';
import { pgTable, uuid, vector, text, jsonb, index } from 'drizzle-orm/pg-core';
import { DB_CONFIG } from '../database.config.js';

export const embeddings = pgTable(
  'embeddings',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    contentId: text('content_id').notNull(),
    contentType: text('content_type').notNull(),
    // Vector dimensions: set via config (Default: 3072 for gemini-embedding-2-preview)
    vector: vector('vector', { dimensions: DB_CONFIG.VECTOR_DIMENSIONS }).notNull(),
    metadata: jsonb('metadata'),
  },
  () => [
    // HNSW index via halfvec expression cast (ADR-003, ADR-017).
    // pgvector HNSW/IVFFlat indexes support max 2000 dims for `vector` type,
    // but halfvec supports up to 4000 dims. We store full-precision vector(3072)
    // and index via halfvec(3072) cast — negligible precision loss for cosine
    // similarity ranking, smaller index size (2 bytes vs 4 bytes per dimension).
    index('embeddings_vector_hnsw_idx').using(
      'hnsw',
      sql`(vector::halfvec(${sql.raw(String(DB_CONFIG.VECTOR_DIMENSIONS))})) halfvec_cosine_ops`,
    ),
  ],
);
