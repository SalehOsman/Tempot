CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS "embeddings" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "content_id" text NOT NULL,
  "content_type" text NOT NULL,
  "vector" vector(3072) NOT NULL,
  "metadata" jsonb
);

CREATE INDEX IF NOT EXISTS "embeddings_vector_hnsw_idx"
  ON "embeddings"
  USING hnsw (("vector"::halfvec(3072)) halfvec_cosine_ops);
