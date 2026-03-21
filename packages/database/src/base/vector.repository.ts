import { cosineDistance } from 'drizzle-orm';
import { embeddings } from '../drizzle/schema';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';

/**
 * Base Repository for Vector operations using Drizzle ORM
 * Rule: XIV (Repository Pattern), ADR-017 (Drizzle for pgvector)
 */
export abstract class DrizzleVectorRepository {
  constructor(protected db: NodePgDatabase) {}

  async search(vec: number[], limit: number = 5) {
    return this.db
      .select()
      .from(embeddings)
      .orderBy(cosineDistance(embeddings.vector, vec))
      .limit(limit);
  }

  async create(data: typeof embeddings.$inferInsert) {
    return this.db.insert(embeddings).values(data).returning();
  }
}
