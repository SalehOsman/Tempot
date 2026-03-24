import { Result, err } from 'neverthrow';
import { AppError } from '@tempot/shared';
import { prisma, Prisma } from '../prisma/client';

/**
 * Minimal interface for the $transaction method we need from the client.
 * The extended client's type is complex; we only need the interactive transaction overload.
 */
interface TransactionCapable {
  $transaction<R>(
    fn: (tx: Prisma.TransactionClient) => Promise<R>,
    options?: {
      maxWait?: number;
      timeout?: number;
      isolationLevel?: Prisma.TransactionIsolationLevel;
    },
  ): Promise<R>;
}

/**
 * Manager for atomic multi-repository operations
 * Rule: FR-007 (Transaction Manager)
 */
export class TransactionManager {
  /**
   * Run a function within a database transaction
   * If the function returns an Err result, the transaction is rolled back
   */
  static async run<T>(
    fn: (tx: Prisma.TransactionClient) => Promise<Result<T, AppError>>,
  ): Promise<Result<T, AppError>> {
    try {
      const client = prisma as unknown as TransactionCapable;
      return await client.$transaction(async (tx: Prisma.TransactionClient) => {
        const result = await fn(tx);
        if (result.isErr()) {
          // In Prisma, throwing an error inside $transaction triggers rollback
          throw result.error;
        }
        return result;
      });
    } catch (e) {
      // Structured logging to stderr. Cannot import @tempot/logger
      // due to circular dependency (logger imports AuditLogRepository from database).
      process.stderr.write(
        JSON.stringify({
          level: 'error',
          module: 'database',
          message: 'Transaction failed',
          error: e instanceof Error ? e.message : String(e),
          timestamp: new Date().toISOString(),
        }) + '\n',
      );
      if (e instanceof AppError) {
        return err(e);
      }
      return err(new AppError('database.transaction_failed', e));
    }
  }
}
