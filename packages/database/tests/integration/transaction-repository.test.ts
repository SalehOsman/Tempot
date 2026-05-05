import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { TestDB } from '../../src/testing/database.helper.js';
import { BaseRepository, PrismaModelDelegate } from '../../src/base/base.repository';
import { TransactionManager } from '../../src/manager/transaction.manager';
import { AppError } from '@tempot/shared';
import { err } from 'neverthrow';

interface UserEntity {
  id: string;
  telegramId: bigint;
  username?: string | null;
  createdBy?: string;
  updatedBy?: string;
}

class UserRepo extends BaseRepository<UserEntity> {
  protected moduleName = 'users';
  protected entityName = 'user';

  // Access the user model delegate from the database client.
  // TransactionClient doesn't expose model accessors in its type,
  // but they exist at runtime. Cast through Record to access.
  protected get model(): PrismaModelDelegate {
    return (this.db as unknown as Record<string, PrismaModelDelegate>).userProfile;
  }
}

describe('BaseRepository Transaction Support', () => {
  const testDb = new TestDB();
  const auditLogger = { log: vi.fn().mockResolvedValue(undefined) };
  let telegramIdSequence = 9_100_000_000_000n;

  function userProfileData(username: string) {
    telegramIdSequence += 1n;
    return { telegramId: telegramIdSequence, username };
  }

  beforeAll(async () => {
    await testDb.start();
    testDb.applyPrismaSchema();
  }, 120_000);

  afterAll(async () => {
    await testDb.stop();
  });

  it('should rollback repository operations when transaction fails', async () => {
    const repo = new UserRepo(auditLogger);

    const result = await TransactionManager.run(async (tx) => {
      const createResult = await repo.withTransaction(tx).create(userProfileData('rollback-me'));
      expect(createResult.isOk()).toBe(true);

      // Force rollback
      return err(new AppError('force.rollback'));
    });

    expect(result.isErr()).toBe(true);

    // Check database directly via testDb (bypassing extensions/transactions)
    const user = await testDb.prisma.userProfile.findFirst({ where: { username: 'rollback-me' } });
    expect(user).toBeNull();
  });

  it('should commit repository operations when transaction succeeds', async () => {
    const repo = new UserRepo(auditLogger);

    const result = await TransactionManager.run(async (tx) => {
      return await repo.withTransaction(tx).create(userProfileData('commit-me'));
    });

    expect(result.isOk()).toBe(true);

    const user = await testDb.prisma.userProfile.findFirst({ where: { username: 'commit-me' } });
    expect(user).toBeDefined();
    expect(user?.username).toBe('commit-me');
  });
});
