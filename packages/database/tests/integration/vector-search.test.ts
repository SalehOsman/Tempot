import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { TestDB } from '../utils/test-db';
import { drizzle } from 'drizzle-orm/node-postgres';
import { DrizzleVectorRepository } from '../../src/base/vector.repository';
import { Pool } from 'pg';

class TestVectorRepository extends DrizzleVectorRepository {}

describe('Vector Search', () => {
  const testDb = new TestDB();
  let repo: TestVectorRepository;
  let pool: Pool;

  beforeAll(async () => {
    await testDb.start();
    const { execSync } = await import('child_process');
    const path = await import('path');
    // We need to push the drizzle schema
    execSync('pnpm exec drizzle-kit push', {
      env: process.env,
      cwd: path.resolve(__dirname, '../../'),
    });

    pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const db = drizzle(pool);
    /* eslint-disable @typescript-eslint/no-explicit-any */
    repo = new TestVectorRepository(db as any);
    /* eslint-enable @typescript-eslint/no-explicit-any */
  }, 60000);

  afterAll(async () => {
    if (pool) await pool.end();
    await testDb.stop();
  });

  it('should return semantically similar results', async () => {
    // Insert some mock embeddings
    // Vector 1: [1, 0, 0, ...]
    const vec1 = new Array(768).fill(0);
    vec1[0] = 1;

    // Vector 2: [0.9, 0.1, 0, ...] - Close to vec1
    const vec2 = new Array(768).fill(0);
    vec2[0] = 0.9;
    vec2[1] = 0.1;

    // Vector 3: [0, 1, 0, ...] - Far from vec1
    const vec3 = new Array(768).fill(0);
    vec3[1] = 1;

    await repo.create({
      contentId: 'item1',
      contentType: 'test',
      vector: vec1,
    });

    await repo.create({
      contentId: 'item2',
      contentType: 'test',
      vector: vec3,
    });

    // Search using vec2 (should find vec1 first)
    const results = await repo.search(vec2, 5);

    expect(results.length).toBeGreaterThan(0);
    expect(results[0].contentId).toBe('item1');
  });
});
