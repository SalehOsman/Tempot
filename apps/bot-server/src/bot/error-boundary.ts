import type { BotError, Context } from 'grammy';
import { generateErrorReference, AppError } from '@tempot/shared';

export interface ErrorBoundaryDeps {
  logger: { error: (data: unknown) => void; warn: (data: unknown) => void };
  eventBus: {
    publish: (event: string, payload: Record<string, unknown>) => Promise<unknown>;
  };
  t: (key: string, options?: Record<string, unknown>) => string;
  sentryReporter?: {
    reportWithReference: (error: AppError, refCode: string) => { isOk: () => boolean };
  };
}

function reportErrorToChannels(
  deps: ErrorBoundaryDeps,
  actualError: Error,
  referenceCode: string,
): void {
  deps.eventBus
    .publish('system.error', {
      referenceCode,
      errorCode: 'bot-server.unhandled_error',
    })
    .catch((error: unknown) => {
      deps.logger.warn({
        code: 'bot-server.event_publish_failed',
        referenceCode,
        error: error instanceof Error ? error.message : String(error),
      });
    });

  if (deps.sentryReporter) {
    try {
      const appErr =
        actualError instanceof AppError
          ? actualError
          : new AppError('bot-server.unhandled_error', { error: actualError.message });
      deps.sentryReporter.reportWithReference(appErr, referenceCode);
    } catch (error: unknown) {
      deps.logger.warn({
        code: 'bot-server.sentry_report_failed',
        referenceCode,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
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
      userId: err.ctx.from?.id,
      chatId: err.ctx.chat?.id,
      error: actualError.message,
      stack: actualError.stack,
    });

    reportErrorToChannels(deps, actualError, referenceCode);

    try {
      const message = deps.t('bot-server.error_message', { referenceCode });
      await err.ctx.reply(message);
    } catch (error: unknown) {
      deps.logger.warn({
        code: 'bot-server.error_reply_failed',
        referenceCode,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  };
}
