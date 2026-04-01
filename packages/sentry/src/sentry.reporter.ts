import * as Sentry from '@sentry/node';
import { ok, err } from 'neverthrow';
import type { Result } from '@tempot/shared';
import { AppError, generateErrorReference } from '@tempot/shared';
import { sentryToggle } from './sentry.toggle.js';
import { isSentryInitialized } from './sentry.client.js';
import { SENTRY_ERRORS } from './sentry.errors.js';
import {
  SENTRY_TAG_ERROR_REFERENCE,
  SENTRY_TAG_ERROR_CODE,
  SENTRY_CONTEXT_APP_ERROR,
} from './sentry.constants.js';

/**
 * Reports errors to Sentry with Rule XXIV reference code tagging.
 *
 * Completes the three-way link:
 * ERR-YYYYMMDD-XXXX → user message ↔ Audit Log ↔ Sentry event
 */
export class SentryReporter {
  /**
   * Report an error to Sentry with its reference code as a tag.
   * Returns the Sentry event ID on success, null if disabled.
   */
  report(error: AppError): Result<string | null, AppError> {
    if (!sentryToggle.isEnabled()) {
      return ok(null);
    }

    if (!isSentryInitialized()) {
      return err(new AppError(SENTRY_ERRORS.NOT_INITIALIZED));
    }

    const referenceCode = error.referenceCode ?? generateErrorReference();
    return this.captureWithScope(error, referenceCode);
  }

  /**
   * Report with an explicit reference code override.
   * Returns null if disabled.
   */
  reportWithReference(error: AppError, referenceCode: string): Result<string | null, AppError> {
    if (!sentryToggle.isEnabled()) {
      return ok(null);
    }

    if (!isSentryInitialized()) {
      return err(new AppError(SENTRY_ERRORS.NOT_INITIALIZED));
    }

    return this.captureWithScope(error, referenceCode);
  }

  private captureWithScope(
    error: AppError,
    referenceCode: string,
  ): Result<string | null, AppError> {
    try {
      let eventId: string | undefined;

      Sentry.withScope((scope) => {
        scope.setTag(SENTRY_TAG_ERROR_REFERENCE, referenceCode);
        scope.setTag(SENTRY_TAG_ERROR_CODE, error.code);
        scope.setContext(SENTRY_CONTEXT_APP_ERROR, {
          code: error.code,
          i18nKey: error.i18nKey,
          details: error.details ?? null,
        });
        eventId = Sentry.captureException(error);
      });

      return ok(eventId ?? null);
    } catch (captureError: unknown) {
      return err(
        new AppError(SENTRY_ERRORS.REPORT_FAILED, {
          originalError: error.code,
          captureError,
        }),
      );
    }
  }
}
