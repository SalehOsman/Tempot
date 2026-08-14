import { AppError, redactSensitiveData } from '@tempot/shared';

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
    message: redactSensitiveData(err.message),
    code: err.code,
    i18nKey: err.i18nKey,
  };

  // Rule XXIV: Include error reference code when present
  if (err.referenceCode) {
    serialized.referenceCode = err.referenceCode;
  }

  // Only include stack in non-production environments
  if (process.env.NODE_ENV !== 'production') {
    serialized.stack = redactSensitiveData(err.stack);
  }

  // Redact PII from details recursively
  if (err.details) {
    serialized.details = redactSensitiveData(err.details);
  }

  return serialized;
};
