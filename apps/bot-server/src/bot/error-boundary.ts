import type { BotError, Context } from 'grammy';
import { generateErrorReference } from '@tempot/shared';

export interface ErrorBoundaryDeps {
  logger: { error: (data: unknown) => void; warn: (data: unknown) => void };
  eventBus: {
    publish: (event: string, payload: Record<string, unknown>) => Promise<unknown>;
  };
  t: (key: string, options?: Record<string, unknown>) => string;
  sentryReporter?: {
    reportWithReference: (error: Error, refCode: string) => { isOk: () => boolean };
  };
}

/**
 * Creates the top-level error boundary for grammY's bot.catch().
 * Generates ERR-YYYYMMDD-XXXX reference codes, logs the full error,
 * emits system.error, optionally reports to Sentry, and sends
 * a localized user-facing message.
 */
export function createErrorBoundary(
  deps: ErrorBoundaryDeps,
): (err: BotError<Context>) => Promise<void> {
  return async (err: BotError<Context>): Promise<void> => {
    const referenceCode = generateErrorReference();
    const actualError = err.error instanceof Error ? err.error : new Error(String(err.error));

    deps.logger.error({
      code: 'bot-server.unhandled_error',
      referenceCode,
      error: actualError.message,
      stack: actualError.stack,
    });

    try {
      await deps.eventBus.publish('system.error', {
        referenceCode,
        errorCode: 'bot-server.unhandled_error',
      });
    } catch {
      // Best-effort
    }

    if (deps.sentryReporter) {
      try {
        deps.sentryReporter.reportWithReference(actualError, referenceCode);
      } catch {
        // Best-effort
      }
    }

    try {
      const message = deps.t('bot-server.error_message', { referenceCode });
      await err.ctx.reply(message);
    } catch {
      // Best-effort — user may have blocked the bot
    }
  };
}
