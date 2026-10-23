import pino, { type Logger as PinoLogger, type LoggerOptions } from 'pino';
import { SENSITIVE_REDACTION_PATHS } from './masking.js';

const isDev = process.env.NODE_ENV !== 'production';

const defaultOptions: LoggerOptions = {
  level: process.env.LOG_LEVEL || (isDev ? 'debug' : 'info'),
  redact: {
    paths: [...SENSITIVE_REDACTION_PATHS],
    censor: '[REDACTED]',
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  formatters: {
    level: (label) => ({ level: label }),
  },
};

export const logger: PinoLogger = pino(defaultOptions);

export interface ChildLoggerContext {
  readonly module: string;
  readonly slice?: string;
  readonly correlationId?: string;
  readonly tenantId?: string;
}

/**
 * Creates a contextual child logger with attached module metadata.
 */
export function createChildLogger(ctx: ChildLoggerContext): PinoLogger {
  return logger.child({
    module: ctx.module,
    slice: ctx.slice,
    correlationId: ctx.correlationId,
    tenantId: ctx.tenantId,
  });
}

export type Logger = PinoLogger;
