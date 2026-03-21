import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { TestDB } from '../utils/test-db';
import { BaseRepository } from '../../src/base/base.repository';
import { TransactionManager } from '../../src/manager/transaction.manager';
import { AppError } from '@tempot/shared';
import { err } from 'neverthrow';

/* eslint-disable @typescript-eslint/no-explicit-any */
class UserRepo extends BaseRepository<any> {
  protected moduleName = 'users';
  protected entityName = 'user';

  // Override to use dynamic model selection based on this.db
  protected get model() {
    return (this.db as any).user;
  }
}

describe('BaseRepository Transaction Support', () => {
  const testDb = new TestDB();
  const auditLogger = { log: async () => {} };

  beforeAll(async () => {
    await testDb.start();
    const { execSync } = await import('child_process');
    const path = await import('path');
    execSync('pnpm prisma db push --accept-data-loss', {
      env: process.env,
      cwd: path.resolve(__dirname, '../../'),
    });
  }, 60000);

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
/* eslint-enable @typescript-eslint/no-explicit-any */
