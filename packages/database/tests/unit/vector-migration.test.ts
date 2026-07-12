import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const migrationPath = new URL(
  '../../prisma/migrations/20260712000000_add_ai_rag_embeddings/migration.sql',
  import.meta.url,
);

describe('AI/RAG vector storage migration', () => {
  it('commits pgvector embeddings table and halfvec index migration evidence', () => {
    expect(existsSync(migrationPath)).toBe(true);

    const migrationSql = readFileSync(migrationPath, 'utf-8');

    expect(migrationSql).toContain('CREATE EXTENSION IF NOT EXISTS vector');
    expect(migrationSql).toContain('CREATE TABLE IF NOT EXISTS "embeddings"');
    expect(migrationSql).toContain('"id" uuid PRIMARY KEY');
    expect(migrationSql).toContain('"content_id" text NOT NULL');
    expect(migrationSql).toContain('"content_type" text NOT NULL');
    expect(migrationSql).toContain('"vector" vector(3072) NOT NULL');
    expect(migrationSql).toContain('"metadata" jsonb');
    expect(migrationSql).toContain('CREATE INDEX IF NOT EXISTS "embeddings_vector_hnsw_idx"');
    expect(migrationSql).toContain('USING hnsw (("vector"::halfvec(3072)) halfvec_cosine_ops)');
  });
});
