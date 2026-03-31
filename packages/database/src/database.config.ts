/**
 * Database configuration constants
 */
export const DB_CONFIG = {
  /**
   * Vector dimensions for pgvector embeddings.
   * Default: 768 (Gemini models)
   * ADR-003 suggests pgvector for embeddings.
   */
  VECTOR_DIMENSIONS: Number(process.env.VECTOR_DIMENSIONS) || 768,
};
