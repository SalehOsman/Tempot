import { sql } from 'drizzle-orm';
import { embeddings } from '../drizzle/drizzle.schema.js';
import { DB_CONFIG } from '../database.config.js';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Result, ok, err } from 'neverthrow';
import { AppError } from '@tempot/shared';

/**
 * Inferred select type for the embeddings table.
 * Represents a single row returned from a query.
 */
type Embedding = typeof embeddings.$inferSelect;

/**
 * Base Repository for Vector operations using Drizzle ORM
 * Rule: XIV (Repository Pattern), ADR-017 (Drizzle for pgvector)
 *
 * Uses halfvec expression casts for similarity search to support >2000 dimensions.
 * pgvector HNSW/IVFFlat indexes cap at 2000 dims for `vector` type but halfvec
 * supports up to 4000 dims. We store full-precision vectors and cast to halfvec
 * at query time — negligible precision loss for cosine similarity ranking.
 */
export abstract class DrizzleVectorRepository {
  constructor(protected db: NodePgDatabase) {}

  /**
   * Perform a similarity search using halfvec cosine distance.
   * Casts both the stored vector and query vector to halfvec for index utilization.
   */
  async search(vec: number[], limit: number = 5): Promise<Result<Embedding[], AppError>> {
    try {
      const dims = DB_CONFIG.VECTOR_DIMENSIONS;
      const results = await this.db
        .select()
        .from(embeddings)
        .orderBy(
          sql`${embeddings.vector}::halfvec(${sql.raw(String(dims))}) <=> ${JSON.stringify(vec)}::halfvec(${sql.raw(String(dims))})`,
        )
        .limit(limit);
      return ok(results);
    } catch (e) {
      return err(new AppError('database.vector_search_failed', e));
    }
  }

  /**
   * Create a new embedding
   */
  async create(data: typeof embeddings.$inferInsert): Promise<Result<Embedding, AppError>> {
    try {
      const result = await this.db.insert(embeddings).values(data).returning();
      return ok(result[0]);
    } catch (e) {
      return err(new AppError('database.vector_create_failed', e));
    }
  }
}
