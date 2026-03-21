import { Result, err } from 'neverthrow';
import { AppError } from '@tempot/shared';
import { prisma } from '../prisma/client';

/**
 * Manager for atomic multi-repository operations
 * Rule: FR-007 (Transaction Manager)
 */
export class TransactionManager {
  /**
   * Run a function within a database transaction
   * If the function returns an Err result, the transaction is rolled back
   */
  /* eslint-disable @typescript-eslint/no-explicit-any */
  static async run<T>(fn: (tx: any) => Promise<Result<T, AppError>>): Promise<Result<T, AppError>> {
    try {
      return await (prisma as any).$transaction(async (tx: any) => {
        const result = await fn(tx);
        if (result.isErr()) {
          // In Prisma, throwing an error inside $transaction triggers rollback
          throw result.error;
        }
        return result;
      });
    } catch (e) {
      if (e instanceof AppError) {
        return err(e);
      }
      return err(new AppError('database.transaction_failed', e));
    }
  }
  /* eslint-enable @typescript-eslint/no-explicit-any */
}
