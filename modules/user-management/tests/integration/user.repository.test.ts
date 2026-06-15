import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { TestDB } from '@tempot/database/testing';
import { UserRepository } from '../../repositories/user.repository.js';

describe('UserRepository identity updates', () => {
  const testDb = new TestDB();
  const auditLogger = { log: vi.fn().mockResolvedValue(undefined) };
  let telegramIdSequence = 9_500_000_000_000n;
  let repository: UserRepository;

  function nextTelegramId(): bigint {
    telegramIdSequence += 1n;
    return telegramIdSequence;
  }

  beforeAll(async () => {
    await testDb.start();
    testDb.applyPrismaSchema();
    repository = new UserRepository(auditLogger, testDb.prisma);
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
      nationalId: '28009010100332',
      gender: 'male',
      governorate: 'eg.governorates.cairo',
    });
    expect(persisted?.birthDate).toEqual(new Date(1980, 8, 1));
    expect(auditLogger.log).toHaveBeenCalledOnce();
  });

  it('leaves every identity field unchanged when the database rejects the update', async () => {
    const existingNationalId = '28009010100222';
    await testDb.prisma.userProfile.create({
      data: {
        telegramId: nextTelegramId(),
        username: 'identity-conflict-owner',
        nationalId: existingNationalId,
      },
    });
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
      nationalId: existingNationalId,
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
