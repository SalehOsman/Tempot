import { describe, it, expect, vi, Mock } from 'vitest';
import { TransactionManager } from '../../src/manager/transaction.manager';
import { prisma, Prisma } from '../../src/prisma/prisma.client.js';
import { ok, err, Result } from 'neverthrow';
import { AppError } from '@tempot/shared';

vi.mock('../../src/prisma/prisma.client', () => ({
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

  it('should write structured JSON to stderr on unexpected transaction failure', async () => {
    const stderrSpy = vi.spyOn(process.stderr, 'write').mockReturnValue(true);
    const unexpectedError = new Error('connection reset');

    (prisma.$transaction as Mock).mockRejectedValue(unexpectedError);

    const result = await TransactionManager.run(async (_tx) => {
      return ok('never reached');
    });

    expect(result.isErr()).toBe(true);
    expect(stderrSpy).toHaveBeenCalledTimes(1);

    const written = stderrSpy.mock.calls[0][0] as string;
    const parsed = JSON.parse(written);
    expect(parsed).toMatchObject({
      level: 'error',
      module: 'database',
      message: 'Transaction failed',
    });
    expect(parsed.error).toBeDefined();

    stderrSpy.mockRestore();
  });
});
