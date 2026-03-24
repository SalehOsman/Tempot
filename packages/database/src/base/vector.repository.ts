import { cosineDistance } from 'drizzle-orm';
import { embeddings } from '../drizzle/schema';
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
 */
export abstract class DrizzleVectorRepository {
  constructor(protected db: NodePgDatabase) {}

  /**
   * Perform a similarity search
   */
  async search(vec: number[], limit: number = 5): Promise<Result<Embedding[], AppError>> {
    try {
      const results = await this.db
        .select()
        .from(embeddings)
        .orderBy(cosineDistance(embeddings.vector, vec))
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
