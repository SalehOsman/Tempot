import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { ok } from 'neverthrow';
import {
  NodeProtectedDataService,
  prisma,
  type ProtectedDataKeyProvider,
} from '../../src/index.js';
import { TestDB } from '../../src/testing/database.helper.js';
import { runSensitiveDataBackfill } from '../../../../scripts/security/sensitive-data-migration.js';
import { assertSensitiveDataCutoverReady } from '../../../../scripts/security/sensitive-data-migration.js';

describe('sensitive data migration', () => {
  const testDb = new TestDB();
  const encryptionKey = Buffer.alloc(32, 11);
  const lookupKey = Buffer.alloc(32, 12);
  const keyProvider: ProtectedDataKeyProvider = {
    getActiveEncryptionKey: () => ok({ version: 'enc-v1', key: encryptionKey }),
    getEncryptionKey: () => ok({ version: 'enc-v1', key: encryptionKey }),
    getActiveLookupKey: () => ok({ version: 'lookup-v1', key: lookupKey }),
    getLookupKey: () => ok({ version: 'lookup-v1', key: lookupKey }),
    getReadableLookupKeyVersions: () => ok(['lookup-v1']),
    validate: () => ok(undefined),
  };
  const protectionService = new NodeProtectedDataService(keyProvider);

  beforeAll(async () => {
    await testDb.start();
    testDb.applyPrismaSchema();
    await testDb.prisma.userProfile.createMany({
      data: [
        {
          id: 'legacy-user-1',
          telegramId: 9_200_000_001n,
          email: 'legacy-one@example.com',
          nationalId: '29801011234567',
          mobileNumber: '+201001234567',
          birthDate: new Date('1998-01-01T00:00:00.000Z'),
        },
        {
          id: 'legacy-user-2',
          telegramId: 9_200_000_002n,
          email: 'legacy-two@example.com',
          nationalId: '29801011234568',
        },
        {
          id: 'legacy-user-3',
          telegramId: 9_200_000_005n,
          email: 'legacy-three@example.com',
          nationalId: '29801011234569',
        },
      ],
    });
    await testDb.prisma.auditLog.create({
      data: {
        action: 'users.update',
        module: 'user-management',
        before: { email: 'legacy-one@example.com', language: 'en' },
        after: { email: 'changed@example.com', language: 'ar' },
      },
    });
  }, 120_000);

  afterAll(async () => {
    await testDb.stop();
  });

  it('resumes from a non-sensitive checkpoint without reprocessing verified rows', async () => {
    const firstRun = await runSensitiveDataBackfill({
      migrationId: 'test-sensitive-data-backfill',
      batchSize: 1,
      stopAfterBatches: 1,
      database: testDb.prisma as unknown as typeof prisma,
      protectionService,
    });
    expect(firstRun.isOk()).toBe(true);
    if (firstRun.isErr()) return;

    const secondInterruptedRun = await runSensitiveDataBackfill({
      migrationId: 'test-sensitive-data-backfill',
      batchSize: 1,
      stopAfterBatches: 1,
      database: testDb.prisma as unknown as typeof prisma,
      protectionService,
    });
    expect(secondInterruptedRun.isOk()).toBe(true);
    if (secondInterruptedRun.isErr()) return;

    const resumedRun = await runSensitiveDataBackfill({
      migrationId: 'test-sensitive-data-backfill',
      batchSize: 1,
      database: testDb.prisma as unknown as typeof prisma,
      protectionService,
    });
    expect(resumedRun.isOk()).toBe(true);
    if (resumedRun.isErr()) return;

    expect(resumedRun.value.processedCount).toBeGreaterThanOrEqual(firstRun.value.processedCount);
    expect(resumedRun.value.duplicateCount).toBe(0);
    expect(JSON.stringify(resumedRun.value)).not.toContain('@example.com');
    const migrated = await testDb.prisma.userProfile.findUnique({
      where: { id: 'legacy-user-1' },
    });
    expect(migrated?.email).toBe('legacy-one@example.com');
    expect(migrated?.emailProtected).not.toBeNull();
    expect(migrated?.emailLookupToken).toBeTruthy();
    const audit = await testDb.prisma.auditLog.findFirst();
    expect(JSON.stringify(audit)).not.toContain('legacy-one@example.com');
    const cutover = await assertSensitiveDataCutoverReady(
      testDb.prisma as unknown as typeof prisma,
      'test-sensitive-data-backfill',
    );
    expect(cutover.isOk()).toBe(true);
  });

  it('keeps legacy plaintext recoverable when verification blocks cutover', async () => {
    await testDb.prisma.userProfile.create({
      data: {
        id: 'legacy-user-rollback',
        telegramId: 9_200_000_003n,
        email: 'rollback@example.com',
      },
    });
    const result = await runSensitiveDataBackfill({
      migrationId: 'test-sensitive-data-rollback',
      batchSize: 10,
      forceVerificationFailure: true,
      database: testDb.prisma as unknown as typeof prisma,
      protectionService,
    });

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.code).toBe('database.protection.migration_verification_failed');
    }
    const restored = await testDb.prisma.userProfile.findUnique({
      where: { id: 'legacy-user-rollback' },
    });
    expect(restored?.email).toBe('rollback@example.com');
    const cutover = await assertSensitiveDataCutoverReady(
      testDb.prisma as unknown as typeof prisma,
      'test-sensitive-data-rollback',
    );
    expect(cutover.isErr()).toBe(true);
  });

  it('reports normalization conflicts in dry-run mode without creating a checkpoint', async () => {
    await testDb.prisma.userProfile.create({
      data: {
        id: 'legacy-user-conflict',
        telegramId: 9_200_000_004n,
        email: ' LEGACY-TWO@example.com ',
      },
    });

    const result = await runSensitiveDataBackfill({
      migrationId: 'test-sensitive-data-dry-run',
      batchSize: 10,
      dryRun: true,
      database: testDb.prisma as unknown as typeof prisma,
      protectionService,
    });

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.status).toBe('dry-run');
      expect(result.value.duplicateCount).toBe(1);
    }
    const checkpoint = await testDb.prisma.sensitiveDataMigrationCheckpoint.findUnique({
      where: { migrationId: 'test-sensitive-data-dry-run' },
    });
    expect(checkpoint).toBeNull();
  });
});
