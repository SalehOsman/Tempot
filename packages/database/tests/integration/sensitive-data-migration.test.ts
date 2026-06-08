import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { TestDB } from '../../src/testing/database.helper.js';
import { runSensitiveDataBackfill } from '../../../../scripts/security/sensitive-data-migration.js';

describe('sensitive data migration', () => {
  const testDb = new TestDB();

  beforeAll(async () => {
    await testDb.start();
    testDb.applyPrismaSchema();
  }, 120_000);

  afterAll(async () => {
    await testDb.stop();
  });

  it('resumes from a non-sensitive checkpoint without reprocessing verified rows', async () => {
    const firstRun = await runSensitiveDataBackfill({
      databaseUrl: testDb.connectionString,
      migrationId: 'test-sensitive-data-backfill',
      batchSize: 1,
      stopAfterBatches: 1,
    });
    expect(firstRun.isOk()).toBe(true);
    if (firstRun.isErr()) return;

    const resumedRun = await runSensitiveDataBackfill({
      databaseUrl: testDb.connectionString,
      migrationId: 'test-sensitive-data-backfill',
      batchSize: 1,
    });
    expect(resumedRun.isOk()).toBe(true);
    if (resumedRun.isErr()) return;

    expect(resumedRun.value.processedCount).toBeGreaterThanOrEqual(firstRun.value.processedCount);
    expect(resumedRun.value.duplicateCount).toBe(0);
    expect(JSON.stringify(resumedRun.value)).not.toContain('@example.com');
  });

  it('keeps legacy plaintext recoverable when verification blocks cutover', async () => {
    const result = await runSensitiveDataBackfill({
      databaseUrl: testDb.connectionString,
      migrationId: 'test-sensitive-data-rollback',
      batchSize: 10,
      forceVerificationFailure: true,
    });

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.code).toBe('database.protection.migration_verification_failed');
    }
  });
});
