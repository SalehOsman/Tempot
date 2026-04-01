import * as Sentry from '@sentry/node';
import { ok, err } from 'neverthrow';
import type { Result, AsyncResult } from '@tempot/shared';
import { AppError } from '@tempot/shared';
import { sentryToggle } from './sentry.toggle.js';
import { SENTRY_ERRORS } from './sentry.errors.js';
import type { SentryConfig } from './sentry.types.js';
import {
  SENTRY_DEFAULT_SAMPLE_RATE,
  SENTRY_DEFAULT_CLOSE_TIMEOUT_MS,
  SENTRY_DSN_ENV_VAR,
} from './sentry.constants.js';

let initialized = false;

/**
 * Initialize the Sentry SDK.
 * No-op if TEMPOT_SENTRY is not 'true'.
 * Requires SENTRY_DSN env var (or config.dsn) when enabled.
 */
export function initSentry(config?: Partial<SentryConfig>): Result<void, AppError> {
  if (!sentryToggle.isEnabled()) {
    return ok(undefined);
  }

  const dsn = config?.dsn ?? process.env[SENTRY_DSN_ENV_VAR];
  if (!dsn) {
    return err(
      new AppError(SENTRY_ERRORS.DSN_MISSING, {
        envVar: SENTRY_DSN_ENV_VAR,
      }),
    );
  }

  try {
    Sentry.init({
      dsn,
      environment: config?.environment ?? 'production',
      release: config?.release,
      sampleRate: config?.sampleRate ?? SENTRY_DEFAULT_SAMPLE_RATE,
      tracesSampleRate: config?.tracesSampleRate ?? 0,
    });
    initialized = true;
    return ok(undefined);
  } catch (error: unknown) {
    return err(new AppError(SENTRY_ERRORS.INIT_FAILED, { error }));
  }
}

/**
 * Flush pending events and close the Sentry SDK.
 * Rule XVII: Graceful Shutdown.
 * AsyncResult<void> = Promise<Result<void, AppError>>
 */
export async function closeSentry(timeoutMs?: number): AsyncResult<void> {
  if (!sentryToggle.isEnabled() || !initialized) {
    return ok(undefined);
  }

  try {
    await Sentry.close(timeoutMs ?? SENTRY_DEFAULT_CLOSE_TIMEOUT_MS);
    initialized = false;
    return ok(undefined);
  } catch (error: unknown) {
    return err(new AppError(SENTRY_ERRORS.CLOSE_FAILED, { error }));
  }
}

/** Check if the SDK has been initialized. */
export function isSentryInitialized(): boolean {
  return initialized;
}
