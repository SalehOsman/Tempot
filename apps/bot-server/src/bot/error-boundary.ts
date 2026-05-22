import type { BotError, Context } from 'grammy';
import { generateErrorReference, AppError } from '@tempot/shared';
import { getInteractionTrace, toInteractionTraceLog } from './interaction-trace.js';
import type { AuditEntry } from './middleware/audit.middleware.js';

export interface ErrorBoundaryDeps {
  logger: { error: (data: unknown) => void; warn: (data: unknown) => void };
  eventBus: {
    publish: (event: string, payload: Record<string, unknown>) => Promise<unknown>;
  };
  auditLog: (entry: AuditEntry) => Promise<void>;
  t: (key: string, options?: Record<string, unknown>) => string;
  sentryReporter?: {
    reportWithReference: (error: AppError, refCode: string) => { isOk: () => boolean };
  };
}

interface ErrorReport {
  deps: ErrorBoundaryDeps;
  actualError: Error;
  referenceCode: string;
  traceLog: Record<string, unknown>;
}

interface ErrorAuditReport {
  deps: ErrorBoundaryDeps;
  referenceCode: string;
  traceLog: Record<string, unknown>;
  userId?: number;
}

async function writeErrorAudit(report: ErrorAuditReport): Promise<void> {
  const { deps, referenceCode, traceLog, userId } = report;
  try {
    await deps.auditLog({
      action: auditAction(traceLog),
      module: auditModule(traceLog),
      userId: userId?.toString(),
      targetId: stringField(traceLog, 'traceId'),
      after: {
        ...traceLog,
        referenceCode,
        errorCode: 'bot-server.unhandled_error',
      },
      status: 'FAILURE',
    });
  } catch (error: unknown) {
    deps.logger.warn({
      code: 'bot-server.error_audit_log_failed',
      referenceCode,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

function auditAction(traceLog: Record<string, unknown>): string {
  return (
    stringField(traceLog, 'callbackData') ??
    stringField(traceLog, 'command') ??
    'bot-server.unhandled_error'
  );
}

function auditModule(traceLog: Record<string, unknown>): string {
  return stringField(traceLog, 'module') ?? 'bot-server';
}

function stringField(record: Record<string, unknown>, key: string): string | undefined {
  const value = record[key];
  return typeof value === 'string' ? value : undefined;
}

function reportErrorToChannels(report: ErrorReport): void {
  const { deps, actualError, referenceCode, traceLog } = report;
  deps.eventBus
    .publish('system.error', {
      referenceCode,
      errorCode: 'bot-server.unhandled_error',
      ...traceLog,
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
    const trace = getInteractionTrace(err.ctx);
    const traceLog = trace ? toInteractionTraceLog(trace) : {};

    deps.logger.error({
      code: 'bot-server.unhandled_error',
      referenceCode,
      ...traceLog,
      userId: err.ctx.from?.id,
      chatId: err.ctx.chat?.id,
      error: actualError.message,
      stack: actualError.stack,
    });

    reportErrorToChannels({ deps, actualError, referenceCode, traceLog });
    await writeErrorAudit({ deps, referenceCode, traceLog, userId: err.ctx.from?.id });

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
