import { AppError } from '@tempot/shared';
import { SENSITIVE_KEYS } from '../logger.config.js';

/**
 * Redacts sensitive information recursively from an object based on provided keys.
 */
function redactRecursive(obj: unknown, keys: string[]): unknown {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => redactRecursive(item, keys));
  }

  // Handle case where it might be a special object (like Date)
  if (Object.prototype.toString.call(obj) !== '[object Object]') {
    return obj;
  }

  const redacted: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    if (keys.includes(key)) {
      redacted[key] = '[REDACTED]';
    } else {
      redacted[key] = redactRecursive(value, keys);
    }
  }
  return redacted;
}

/**
 * Custom serializer for AppError to be used with Pino.
 * Implements Rule XXIII (No double logging) and PII redaction.
 */
export const appErrorSerializer = (err: unknown): unknown => {
  if (!(err instanceof AppError)) {
    return err;
  }

  // Rule XXIII: No double logging
  if (err.loggedAt) {
    return {
      message: 'Already logged',
      code: err.code,
      __redundant: true,
    };
  }

  // Mark as logged to prevent double logging down the line
  err.loggedAt = new Date();

  const serialized: Record<string, unknown> = {
    message: err.message,
    code: err.code,
    i18nKey: err.i18nKey,
  };

  // Rule XXIV: Include error reference code when present
  if (err.referenceCode) {
    serialized.referenceCode = err.referenceCode;
  }

  // Only include stack in non-production environments
  if (process.env.NODE_ENV !== 'production') {
    serialized.stack = err.stack;
  }

  // Redact PII from details recursively
  if (err.details) {
    serialized.details = redactRecursive(err.details, SENSITIVE_KEYS);
  }

  return serialized;
};
