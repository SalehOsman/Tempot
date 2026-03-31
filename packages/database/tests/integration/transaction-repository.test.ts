import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { TestDB } from '../../src/testing/database.helper.js';
import { BaseRepository, PrismaModelDelegate } from '../../src/base/base.repository';
import { TransactionManager } from '../../src/manager/transaction.manager';
import { AppError } from '@tempot/shared';
import { err } from 'neverthrow';
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface UserEntity {
  id: string;
  name: string;
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
    return (this.db as unknown as Record<string, PrismaModelDelegate>).user;
  }
}

describe('BaseRepository Transaction Support', () => {
  const testDb = new TestDB();
  const auditLogger = { log: vi.fn().mockResolvedValue(undefined) };

  beforeAll(async () => {
    await testDb.start();

    // Run schema push for integration tests
    execSync('cmd.exe /c pnpm prisma db push --accept-data-loss', {
      env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL },
      cwd: path.resolve(__dirname, '../../'),
    });
  }, 120_000);

  afterAll(async () => {
    await testDb.stop();
  });

  it('should rollback repository operations when transaction fails', async () => {
    const repo = new UserRepo(auditLogger);

    const result = await TransactionManager.run(async (tx) => {
      const createResult = await repo.withTransaction(tx).create({ name: 'RollbackMe' });
      expect(createResult.isOk()).toBe(true);

      // Force rollback
      return err(new AppError('force.rollback'));
    });

    expect(result.isErr()).toBe(true);

    // Check database directly via testDb (bypassing extensions/transactions)
    const user = await testDb.prisma.user.findFirst({ where: { name: 'RollbackMe' } });
    expect(user).toBeNull();
  });

  it('should commit repository operations when transaction succeeds', async () => {
    const repo = new UserRepo(auditLogger);

    const result = await TransactionManager.run(async (tx) => {
      return await repo.withTransaction(tx).create({ name: 'CommitMe' });
    });

    expect(result.isOk()).toBe(true);

    const user = await testDb.prisma.user.findFirst({ where: { name: 'CommitMe' } });
    expect(user).toBeDefined();
    expect(user?.name).toBe('CommitMe');
  });
});
