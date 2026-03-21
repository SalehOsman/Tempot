import { cosineDistance } from 'drizzle-orm';
import { embeddings } from '../drizzle/schema';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Result, ok, err } from 'neverthrow';
import { AppError } from '@tempot/shared';

/**
 * Base Repository for Vector operations using Drizzle ORM
 * Rule: XIV (Repository Pattern), ADR-017 (Drizzle for pgvector)
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
export abstract class DrizzleVectorRepository {
  constructor(protected db: NodePgDatabase) {}

  /**
   * Perform a similarity search
   */
  async search(vec: number[], limit: number = 5): Promise<Result<any[], AppError>> {
    try {
      const results = await (this.db.select() as any)
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
  async create(data: typeof embeddings.$inferInsert): Promise<Result<any, AppError>> {
    try {
      const result = await this.db.insert(embeddings).values(data).returning();
      return ok(result[0]);
    } catch (e) {
      return err(new AppError('database.vector_create_failed', e));
    }
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any */
