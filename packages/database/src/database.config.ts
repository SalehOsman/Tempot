/**
 * Database configuration constants
 */
export const DB_CONFIG = {
  /**
   * Vector dimensions for pgvector embeddings.
   * Default: 3072 (gemini-embedding-2-preview model)
   * ADR-003 suggests pgvector for embeddings.
   */
  VECTOR_DIMENSIONS: Number(process.env.VECTOR_DIMENSIONS) || 3072,
};
