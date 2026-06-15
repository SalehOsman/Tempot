import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { NodeProtectedDataService, type ProtectedDataKeyProvider } from '@tempot/database';
import { TestDB } from '@tempot/database/testing';
import { ok } from 'neverthrow';
import { UserRepository } from '../../repositories/user.repository.js';

describe('UserRepository identity updates', () => {
  const testDb = new TestDB();
  const auditLogger = { log: vi.fn().mockResolvedValue(undefined) };
  const encryptionKey = Buffer.alloc(32, 61);
  const lookupKey = Buffer.alloc(32, 62);
  const keyProvider: ProtectedDataKeyProvider = {
    getActiveEncryptionKey: () => ok({ version: 'enc-v1', key: encryptionKey }),
    getEncryptionKey: () => ok({ version: 'enc-v1', key: encryptionKey }),
    getActiveLookupKey: () => ok({ version: 'lookup-v1', key: lookupKey }),
    getLookupKey: () => ok({ version: 'lookup-v1', key: lookupKey }),
    getReadableLookupKeyVersions: () => ok(['lookup-v1']),
    validate: () => ok(undefined),
  };
  let telegramIdSequence = 9_500_000_000_000n;
  let repository: UserRepository;

  function nextTelegramId(): bigint {
    telegramIdSequence += 1n;
    return telegramIdSequence;
  }

  beforeAll(async () => {
    await testDb.start();
    testDb.applyPrismaSchema();
    repository = new UserRepository(
      auditLogger,
      testDb.prisma,
      new NodeProtectedDataService(keyProvider),
    );
  }, 120_000);

  afterAll(async () => {
    await testDb.stop();
  });

  it('persists all identity fields in one update and one audit operation', async () => {
    const user = await testDb.prisma.userProfile.create({
      data: { telegramId: nextTelegramId(), username: 'identity-success' },
    });
    auditLogger.log.mockClear();

    const result = await repository.updateIdentity(user.id, {
      nationalId: '28009010100332',
      gender: 'male',
      birthDate: new Date(1980, 8, 1),
      governorate: 'eg.governorates.cairo',
    });

    expect(result.isOk()).toBe(true);
    const persisted = await testDb.prisma.userProfile.findUnique({ where: { id: user.id } });
    expect(persisted).toMatchObject({
      nationalId: null,
      nationalIdLookupKeyVersion: 'lookup-v1',
      nationalIdNormalizationVersion: 'national-id-v1',
      birthDate: null,
      gender: 'male',
      governorate: 'eg.governorates.cairo',
    });
    expect(persisted?.nationalIdLookupToken).toEqual(expect.any(String));
    expect(persisted?.nationalIdProtected).toEqual(
      expect.objectContaining({ algorithm: 'aes-256-gcm', keyVersion: 'enc-v1' }),
    );
    expect(persisted?.birthDateProtected).toEqual(
      expect.objectContaining({ algorithm: 'aes-256-gcm', keyVersion: 'enc-v1' }),
    );
    expect(auditLogger.log).toHaveBeenCalledOnce();
  });

  it('leaves every identity field unchanged when protected input is rejected', async () => {
    const target = await testDb.prisma.userProfile.create({
      data: {
        telegramId: nextTelegramId(),
        username: 'identity-conflict-target',
        nationalId: '29901011234567',
        gender: 'female',
        birthDate: new Date(1999, 0, 1),
        governorate: 'old-governorate',
      },
    });
    auditLogger.log.mockClear();

    const result = await repository.updateIdentity(target.id, {
      nationalId: '2800901-9900332',
      gender: 'male',
      birthDate: new Date(1980, 8, 1),
      governorate: 'eg.governorates.cairo',
    });

    expect(result.isErr()).toBe(true);
    const persisted = await testDb.prisma.userProfile.findUnique({ where: { id: target.id } });
    expect(persisted).toMatchObject({
      nationalId: '29901011234567',
      gender: 'female',
      governorate: 'old-governorate',
    });
    expect(persisted?.birthDate).toEqual(new Date(1999, 0, 1));
    expect(auditLogger.log).not.toHaveBeenCalled();
  });
});
