import { describe, it, expect, vi, Mock } from 'vitest';
import { TransactionManager } from '../../src/manager/transaction.manager';
import { prisma, Prisma } from '../../src/prisma/client';
import { ok, err, Result } from 'neverthrow';
import { AppError } from '@tempot/shared';

vi.mock('../../src/prisma/client', () => ({
  prisma: {
    $transaction: vi.fn(),
  },
}));

describe('TransactionManager', () => {
  it('should return ok result when transaction succeeds', async () => {
    const expectedResult = ok('success');
    (prisma.$transaction as Mock).mockResolvedValue(expectedResult);

    const result = await TransactionManager.run(async (_tx) => {
      return expectedResult;
    });

    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toBe('success');
  });

  it('should return err result and trigger rollback when task fails', async () => {
    const expectedError = new AppError('test.error');
    (prisma.$transaction as Mock).mockImplementation(
      async (fn: (tx: Prisma.TransactionClient) => Promise<Result<unknown, AppError>>) => {
        const result = await fn({} as Prisma.TransactionClient);
        if (result.isErr()) throw result.error;
        return result;
      },
    );

    const result = await TransactionManager.run(async (_tx) => {
      return err(expectedError);
    });

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr()).toBe(expectedError);
  });
});
