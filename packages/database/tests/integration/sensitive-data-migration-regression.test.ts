import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { ok } from 'neverthrow';
import {
  NodeProtectedDataService,
  prisma,
  type ProtectedDataKeyProvider,
} from '../../src/index.js';
import { TestDB } from '../../src/testing/database.helper.js';
import { runSensitiveDataBackfill } from '../../../../scripts/security/sensitive-data-migration.js';
import {
  loadCheckpoint,
  loadMigrationBatch,
  sanitizeHistoricalAudit,
  saveCheckpoint,
} from '../../../../scripts/security/sensitive-data-migration.persistence.js';
import { migrateAndVerifyRow } from '../../../../scripts/security/sensitive-data-migration.row.js';
import type { MigrationDatabase } from '../../../../scripts/security/sensitive-data-migration.types.js';

describe('sensitive data migration regressions', () => {
  const testDb = new TestDB();
  const encryptionKey = Buffer.alloc(32, 21);
  const lookupKey = Buffer.alloc(32, 22);
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
  }, 120_000);

  afterAll(async () => {
    await testDb.stop();
  });

  it('should preserve a concurrent protected update when backfill holds a stale row', async () => {
    const row = await testDb.prisma.userProfile.create({
      data: {
        id: 'concurrent-update-user',
        telegramId: 9_300_000_001n,
        email: 'stale@example.com',
      },
    });
    const concurrentValue = 'current@example.com';
    const protectedValue = protectionService.protect(concurrentValue, {
      fieldId: 'email',
      recordId: row.id,
    });
    const lookup = protectionService.createLookupToken(concurrentValue, 'email');
    expect(protectedValue.isOk()).toBe(true);
    expect(lookup.isOk()).toBe(true);
    if (protectedValue.isErr() || lookup.isErr()) return;

    await testDb.prisma.userProfile.update({
      where: { id: row.id },
      data: {
        email: null,
        emailProtected: protectedValue.value,
        emailLookupToken: lookup.value.token,
        emailLookupKeyVersion: lookup.value.tokenKeyVersion,
        emailNormalizationVersion: lookup.value.normalizationVersion,
      },
    });

    const result = await migrateAndVerifyRow(
      testDb.prisma as unknown as typeof prisma,
      protectionService,
      row,
    );
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.code).toBe('database.protection.migration_concurrent_update');
    }

    const stored = await testDb.prisma.userProfile.findUniqueOrThrow({ where: { id: row.id } });
    const recovered = protectionService.recover(stored.emailProtected as never, {
      fieldId: 'email',
      recordId: row.id,
    });
    expect(recovered.isOk()).toBe(true);
    if (recovered.isOk()) {
      expect(recovered.value).toBe(concurrentValue);
    }
  });

  it('should detect a duplicate shared by protected and plaintext rows', async () => {
    const baseline = await runSensitiveDataBackfill({
      migrationId: 'protected-conflict-baseline',
      batchSize: 10,
      dryRun: true,
      database: testDb.prisma as unknown as typeof prisma,
      protectionService,
    });
    expect(baseline.isOk()).toBe(true);
    if (baseline.isErr()) return;

    const protectedEmail = 'protected-conflict@example.com';
    const protectedValue = protectionService.protect(protectedEmail, {
      fieldId: 'email',
      recordId: 'protected-conflict-user',
    });
    const lookup = protectionService.createLookupToken(protectedEmail, 'email');
    expect(protectedValue.isOk()).toBe(true);
    expect(lookup.isOk()).toBe(true);
    if (protectedValue.isErr() || lookup.isErr()) return;

    await testDb.prisma.userProfile.createMany({
      data: [
        {
          id: 'protected-conflict-user',
          telegramId: 9_300_000_002n,
          emailProtected: protectedValue.value,
          emailLookupToken: lookup.value.token,
          emailLookupKeyVersion: lookup.value.tokenKeyVersion,
          emailNormalizationVersion: lookup.value.normalizationVersion,
        },
        {
          id: 'plaintext-conflict-user',
          telegramId: 9_300_000_003n,
          email: ' PROTECTED-CONFLICT@example.com ',
        },
      ],
    });

    const result = await runSensitiveDataBackfill({
      migrationId: 'protected-conflict-check',
      batchSize: 10,
      dryRun: true,
      database: testDb.prisma as unknown as typeof prisma,
      protectionService,
    });
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.duplicateCount).toBe(baseline.value.duplicateCount + 1);
    }
  });

  it('should detect equivalent national ID formats as one migration conflict', async () => {
    const baseline = await runSensitiveDataBackfill({
      migrationId: 'national-id-conflict-baseline',
      batchSize: 10,
      dryRun: true,
      database: testDb.prisma as unknown as typeof prisma,
      protectionService,
    });
    expect(baseline.isOk()).toBe(true);
    if (baseline.isErr()) return;

    const compactNationalId = '28009010100332';
    const protectedValue = protectionService.protect(compactNationalId, {
      fieldId: 'nationalId',
      recordId: 'protected-national-id-conflict-user',
    });
    const lookup = protectionService.createLookupToken(compactNationalId, 'nationalId');
    expect(protectedValue.isOk()).toBe(true);
    expect(lookup.isOk()).toBe(true);
    if (protectedValue.isErr() || lookup.isErr()) return;

    await testDb.prisma.userProfile.createMany({
      data: [
        {
          id: 'protected-national-id-conflict-user',
          telegramId: 9_300_000_005n,
          nationalIdProtected: protectedValue.value,
          nationalIdLookupToken: lookup.value.token,
          nationalIdLookupKeyVersion: lookup.value.tokenKeyVersion,
          nationalIdNormalizationVersion: lookup.value.normalizationVersion,
        },
        {
          id: 'plaintext-national-id-conflict-user',
          telegramId: 9_300_000_006n,
          nationalId: '2800901-0100332',
        },
      ],
    });

    const result = await runSensitiveDataBackfill({
      migrationId: 'national-id-conflict-check',
      batchSize: 10,
      dryRun: true,
      database: testDb.prisma as unknown as typeof prisma,
      protectionService,
    });

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.duplicateCount).toBe(baseline.value.duplicateCount + 1);
    }
  });

  it('should verify a formatted national ID with its canonical migration token', async () => {
    const row = await testDb.prisma.userProfile.create({
      data: {
        id: 'formatted-national-id-migration-user',
        telegramId: 9_300_000_007n,
        nationalId: '2800901 0200332',
      },
    });

    const result = await migrateAndVerifyRow(
      testDb.prisma as unknown as typeof prisma,
      protectionService,
      row,
    );

    expect(result.isOk()).toBe(true);
    const stored = await testDb.prisma.userProfile.findUniqueOrThrow({
      where: { id: row.id },
    });
    const canonicalToken = protectionService
      .createLookupToken('2800901-0200332', 'nationalId')
      ._unsafeUnwrap();
    expect(stored.nationalIdLookupToken).toBe(canonicalToken.token);
  });

  it('should return a typed error when a migration database operation fails', async () => {
    const database = {
      userProfile: {
        findMany: async () => Promise.reject(new Error('db-down')),
      },
    } as unknown as MigrationDatabase;

    const invocation = runSensitiveDataBackfill({
      migrationId: 'database-failure',
      batchSize: 10,
      dryRun: true,
      database,
      protectionService,
    });

    await expect(invocation).resolves.toMatchObject({
      error: {
        code: 'database.protection.migration_database_failed',
      },
    });
  });

  it('should return typed errors from public migration persistence helpers', async () => {
    const reject = async () => Promise.reject(new Error('db-down'));
    const database = {
      userProfile: { findMany: reject, updateMany: reject },
      auditLog: { findMany: reject },
      sensitiveDataMigrationCheckpoint: { findUnique: reject, upsert: reject },
    } as unknown as MigrationDatabase;
    const row = await testDb.prisma.userProfile.create({
      data: {
        id: 'helper-failure-user',
        telegramId: 9_300_000_004n,
        email: 'helper-failure@example.com',
      },
    });

    const results = await Promise.all([
      loadMigrationBatch(database, null, 10),
      sanitizeHistoricalAudit(database),
      loadCheckpoint(database, 'helper-failure'),
      saveCheckpoint(database, 'helper-failure', {
        cursor: null,
        processedCount: 0,
        verifiedCount: 0,
        failureCount: 0,
        status: 'PENDING',
      }),
      migrateAndVerifyRow(database, protectionService, row),
    ]);

    for (const result of results) {
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe('database.protection.migration_database_failed');
      }
    }
  });

  it('should sanitize historical audit snapshots with the shared allowlist', async () => {
    const canary = 'unexpected-historical-audit-canary';
    const audit = await testDb.prisma.auditLog.create({
      data: {
        action: 'users.userProfile.update',
        module: 'users',
        before: {
          language: 'ar',
          role: 'USER',
          changes: [
            {
              fieldId: 'email',
              protected: true,
              changeKind: 'changed',
              unexpectedMetadata: canary,
            },
            {
              fieldId: 'unclassified',
              protected: true,
              changeKind: 'changed',
            },
            {
              fieldId: 'nationalId',
              protected: false,
              changeKind: 'changed',
            },
          ],
          unknownField: canary,
          nested: {
            anotherUnknownField: canary,
          },
        },
        after: {
          language: 'en',
          role: 'ADMIN',
          changes: [
            {
              fieldId: 'mobileNumber',
              protected: true,
              changeKind: 'added',
              nestedMetadata: {
                privateValue: canary,
              },
            },
            {
              fieldId: 'birthDate',
              protected: true,
              changeKind: 'invalid',
            },
          ],
          username: canary,
          unexpectedProfile: {
            privateValue: canary,
          },
        },
      },
    });

    const result = await sanitizeHistoricalAudit(testDb.prisma as unknown as MigrationDatabase);

    expect(result.isOk()).toBe(true);
    const sanitized = await testDb.prisma.auditLog.findUniqueOrThrow({
      where: { id: audit.id },
    });
    expect(sanitized.before).toEqual({
      language: 'ar',
      role: 'USER',
      changes: [
        {
          fieldId: 'email',
          protected: true,
          changeKind: 'changed',
        },
      ],
    });
    expect(sanitized.after).toEqual({
      language: 'en',
      role: 'ADMIN',
      changes: [
        {
          fieldId: 'mobileNumber',
          protected: true,
          changeKind: 'added',
        },
      ],
    });
    expect(JSON.stringify(sanitized)).not.toContain(canary);
  });
});
