import { ok, err } from 'neverthrow';
import type { Result } from '../result';
import type { AsyncResult } from '../result';
import { AppError } from '../errors';

/**
 * Logger interface for ShutdownManager.
 * Uses a minimal interface to avoid circular dependency with @tempot/logger.
 */
export interface ShutdownLogger {
  info: (message: string) => void;
  error: (data: Record<string, unknown>) => void;
}

/**
 * Centralized Shutdown Manager for Tempot
 * Rule: XVII (Graceful Shutdown), XXI (Result Pattern)
 *
 * Instance-based with injected logger. No console.* calls.
 * Fatal timeout guard uses process.stderr.write + process.exit(1).
 */
export class ShutdownManager {
  private hooks: Array<() => Promise<void>> = [];

  constructor(private readonly logger: ShutdownLogger) {}

  /**
   * Register a new shutdown hook
   */
  register(hook: () => Promise<void>): Result<void, AppError> {
    this.hooks.push(hook);
    return ok(undefined);
  }

  /**
   * Execute all registered hooks with a 30s timeout safety.
   * Returns err if any hook failed, but always executes all hooks.
   */
  async execute(): AsyncResult<void> {
    this.logger.info(`Shutdown initiated. Executing ${this.hooks.length} hooks...`);

    const timeout = setTimeout(() => {
      process.stderr.write(
        JSON.stringify({
          level: 'fatal',
          module: 'shared',
          message: 'Shutdown exceeded 30s timeout. Forcing exit.',
          timestamp: new Date().toISOString(),
        }) + '\n',
      );
      process.exit(1);
    }, 30000);

    const errors: Error[] = [];

    for (const hook of this.hooks) {
      try {
        await hook();
      } catch (e) {
        const error = e instanceof Error ? e : new Error(String(e));
        errors.push(error);
        this.logger.error({
          code: 'shared.shutdown_hook_error',
          message: 'Error during shutdown hook',
          error: error.message,
        });
      }
    }

    clearTimeout(timeout);

    if (errors.length > 0) {
      return err(
        new AppError('shared.shutdown_hook_failed', {
          failedCount: errors.length,
          errors: errors.map((e) => e.message),
        }),
      );
    }

    this.logger.info('All shutdown hooks completed.');
    return ok(undefined);
  }

  /**
   * Clear all hooks (for testing)
   */
  clearHooks(): void {
    this.hooks = [];
  }
}
