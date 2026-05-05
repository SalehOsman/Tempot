import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { TestDB } from '../../src/testing/database.helper.js';
import { drizzle } from 'drizzle-orm/node-postgres';
import { DrizzleVectorRepository } from '../../src/base/vector.repository';
import { DB_CONFIG } from '../../src/database.config';
import { Pool } from 'pg';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';

class TestVectorRepository extends DrizzleVectorRepository {}

describe('Vector Search', () => {
  const testDb = new TestDB();
  let repo: TestVectorRepository;
  let pool: Pool;

  beforeAll(async () => {
    await testDb.start();
    await testDb.applyVectorSchema();

    pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const db: NodePgDatabase = drizzle(pool);
    repo = new TestVectorRepository(db);
  }, 120_000);

  afterAll(async () => {
    if (pool) await pool.end();
    await testDb.stop();
  });

  it('should return semantically similar results via Result object', async () => {
    const dims = DB_CONFIG.VECTOR_DIMENSIONS;

    // Insert some mock embeddings
    const vec1 = new Array(dims).fill(0);
    vec1[0] = 1;

    const vec2 = new Array(dims).fill(0);
    vec2[0] = 0.9;
    vec2[1] = 0.1;

    const vec3 = new Array(dims).fill(0);
    vec3[1] = 1;

    const createResult1 = await repo.create({
      contentId: 'item1',
      contentType: 'test',
      vector: vec1,
    });
    expect(createResult1.isOk()).toBe(true);

    const createResult2 = await repo.create({
      contentId: 'item2',
      contentType: 'test',
      vector: vec3,
    });
    expect(createResult2.isOk()).toBe(true);

    // Search using vec2 (should find vec1 first)
    const searchResult = await repo.search(vec2, 5);
    expect(searchResult.isOk()).toBe(true);

    const results = searchResult._unsafeUnwrap();
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].contentId).toBe('item1');
  });
});
