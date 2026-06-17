import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  NodeProtectedDataService,
  prisma,
  StaticProtectedDataKeyProvider,
} from '../../src/index.js';
import { TestDB } from '../../src/testing/database.helper.js';
import { runSensitiveDataRotation } from '../../../../scripts/security/sensitive-data-rotation.js';
import { rotateAndVerifyRow } from '../../../../scripts/security/sensitive-data-rotation.row.js';

describe('sensitive data key rotation', () => {
  const testDb = new TestDB();
  const oldEncryptionKey = Buffer.alloc(32, 21);
  const newEncryptionKey = Buffer.alloc(32, 22);
  const oldLookupKey = Buffer.alloc(32, 23);
  const newLookupKey = Buffer.alloc(32, 24);
  const rotatingService = new NodeProtectedDataService(
    new StaticProtectedDataKeyProvider({
      activeEncryptionKeyVersion: 'enc-v2',
      encryptionKeys: {
        'enc-v1': oldEncryptionKey,
        'enc-v2': newEncryptionKey,
      },
      activeLookupKeyVersion: 'lookup-v2',
      lookupKeys: {
        'lookup-v1': oldLookupKey,
        'lookup-v2': newLookupKey,
      },
      encryptionKeyStates: { 'enc-v1': 'retiring', 'enc-v2': 'active' },
      lookupKeyStates: { 'lookup-v1': 'retiring', 'lookup-v2': 'active' },
    }),
  );

  beforeAll(async () => {
    await testDb.start();
    testDb.applyPrismaSchema();
    await testDb.prisma.sensitiveDataMigrationCheckpoint.deleteMany();
    await testDb.prisma.auditLog.deleteMany();
    await testDb.prisma.userProfile.deleteMany();
    const oldService = new NodeProtectedDataService(
      new StaticProtectedDataKeyProvider({
        activeEncryptionKeyVersion: 'enc-v1',
        encryptionKeys: { 'enc-v1': oldEncryptionKey },
        activeLookupKeyVersion: 'lookup-v1',
        lookupKeys: { 'lookup-v1': oldLookupKey },
      }),
    );

    for (const [index, id] of ['rotation-user-1', 'rotation-user-2'].entries()) {
      const email = `rotation-${index + 1}@example.com`;
      const payload = oldService.protect(email, { fieldId: 'email', recordId: id })._unsafeUnwrap();
      const token = oldService.createLookupToken(email, 'email')._unsafeUnwrap();
      await testDb.prisma.userProfile.create({
        data: {
          id,
          telegramId: BigInt(9_300_000_001 + index),
          emailProtected: payload,
          emailLookupToken: token.token,
          emailLookupKeyVersion: token.tokenKeyVersion,
          emailNormalizationVersion: token.normalizationVersion,
        },
      });
    }
  }, 120_000);

  afterAll(async () => {
    await testDb.stop();
  });

  it('resumes bounded rotation and makes the old key removable after verification', async () => {
    const paused = await runSensitiveDataRotation({
      migrationId: 'test-key-rotation',
      fromEncryptionKeyVersion: 'enc-v1',
      batchSize: 1,
      stopAfterBatches: 1,
      database: testDb.prisma as unknown as typeof prisma,
      protectionService: rotatingService,
    });
    expect(paused.isOk()).toBe(true);
    if (paused.isOk()) expect(paused.value.retirementReady).toBe(false);

    const completed = await runSensitiveDataRotation({
      migrationId: 'test-key-rotation',
      fromEncryptionKeyVersion: 'enc-v1',
      batchSize: 1,
      database: testDb.prisma as unknown as typeof prisma,
      protectionService: rotatingService,
    });
    expect(completed.isOk()).toBe(true);
    if (completed.isErr()) return;
    expect(completed.value.remainingOldReferences).toBe(0);
    expect(completed.value.retirementReady).toBe(true);

    const newOnlyService = new NodeProtectedDataService(
      new StaticProtectedDataKeyProvider({
        activeEncryptionKeyVersion: 'enc-v2',
        encryptionKeys: { 'enc-v2': newEncryptionKey },
        activeLookupKeyVersion: 'lookup-v2',
        lookupKeys: { 'lookup-v2': newLookupKey },
      }),
    );
    const row = await testDb.prisma.userProfile.findUnique({
      where: { id: 'rotation-user-1' },
    });
    expect(row?.emailLookupKeyVersion).toBe('lookup-v2');
    const recovered = newOnlyService.recover(row?.emailProtected as never, {
      fieldId: 'email',
      recordId: 'rotation-user-1',
    });
    expect(recovered.isOk()).toBe(true);
    if (recovered.isOk()) expect(recovered.value).toBe('rotation-1@example.com');
  });

  it('rejects a stale rotation write without replacing a concurrent protected update', async () => {
    const recordId = 'rotation-concurrent-user';
    const oldService = new NodeProtectedDataService(
      new StaticProtectedDataKeyProvider({
        activeEncryptionKeyVersion: 'enc-v1',
        encryptionKeys: { 'enc-v1': oldEncryptionKey },
        activeLookupKeyVersion: 'lookup-v1',
        lookupKeys: { 'lookup-v1': oldLookupKey },
      }),
    );
    const oldEmail = 'rotation-stale@example.com';
    const oldLookup = oldService.createLookupToken(oldEmail, 'email')._unsafeUnwrap();
    await testDb.prisma.userProfile.create({
      data: {
        id: recordId,
        telegramId: 9_300_000_003n,
        emailProtected: oldService
          .protect(oldEmail, { fieldId: 'email', recordId })
          ._unsafeUnwrap(),
        emailLookupToken: oldLookup.token,
        emailLookupKeyVersion: oldLookup.tokenKeyVersion,
        emailNormalizationVersion: oldLookup.normalizationVersion,
      },
    });
    const staleRow = await testDb.prisma.userProfile.findUniqueOrThrow({
      where: { id: recordId },
    });
    const concurrentEmail = 'rotation-concurrent@example.com';
    const concurrentLookup = rotatingService
      .createLookupToken(concurrentEmail, 'email')
      ._unsafeUnwrap();
    const concurrentPayload = rotatingService
      .protect(concurrentEmail, { fieldId: 'email', recordId })
      ._unsafeUnwrap();
    const concurrentUpdatedAt = new Date(staleRow.updatedAt.getTime() + 1_000);
    await testDb.prisma.userProfile.update({
      where: { id: recordId },
      data: {
        emailProtected: concurrentPayload,
        emailLookupToken: concurrentLookup.token,
        emailLookupKeyVersion: concurrentLookup.tokenKeyVersion,
        emailNormalizationVersion: concurrentLookup.normalizationVersion,
        updatedAt: concurrentUpdatedAt,
      },
    });

    const result = await rotateAndVerifyRow(
      testDb.prisma as unknown as typeof prisma,
      {
        migrationId: 'test-concurrent-key-rotation',
        fromEncryptionKeyVersion: 'enc-v1',
        batchSize: 1,
        protectionService: rotatingService,
      },
      staleRow,
    );

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.code).toBe('database.protection.rotation_concurrent_update');
    }
    const persisted = await testDb.prisma.userProfile.findUniqueOrThrow({
      where: { id: recordId },
    });
    expect(persisted.updatedAt).toEqual(concurrentUpdatedAt);
    expect(persisted.emailProtected).toEqual(concurrentPayload);
    const recovered = rotatingService.recover(persisted.emailProtected as never, {
      fieldId: 'email',
      recordId,
    });
    expect(recovered._unsafeUnwrap()).toBe(concurrentEmail);
  });
});
