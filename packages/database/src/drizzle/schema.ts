import { pgTable, uuid, vector, text, jsonb } from 'drizzle-orm/pg-core';

export const embeddings = pgTable('embeddings', {
  id: uuid('id').primaryKey().defaultRandom(),
  contentId: text('content_id').notNull(),
  contentType: text('content_type').notNull(),
  // Vector dimensions: 1536 for OpenAI / 768 for Gemini
  // ADR-003 suggests pgvector for embeddings
  vector: vector('vector', { dimensions: 768 }).notNull(),
  metadata: jsonb('metadata'),
});
