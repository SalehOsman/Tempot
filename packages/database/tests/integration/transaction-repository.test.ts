import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { TestDB } from '../utils/test-db';
import { BaseRepository } from '../../src/base/base.repository';
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

  // Override to use dynamic model selection based on this.db
  protected get model() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (this.db as any).user;
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
