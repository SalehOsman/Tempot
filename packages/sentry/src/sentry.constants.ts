/** Sentry tag name for the ERR-YYYYMMDD-XXXX reference code. */
export const SENTRY_TAG_ERROR_REFERENCE = 'errorReference';

/** Sentry tag name for the Rule XXII dot-notation error code. */
export const SENTRY_TAG_ERROR_CODE = 'errorCode';

/** Sentry context name for AppError details. */
export const SENTRY_CONTEXT_APP_ERROR = 'appError';

/** Default error sample rate (1.0 = capture all errors). */
export const SENTRY_DEFAULT_SAMPLE_RATE = 1.0;

/** Default timeout in ms for flushing events on shutdown. */
export const SENTRY_DEFAULT_CLOSE_TIMEOUT_MS = 2000;

/** Environment variable name for the Sentry DSN. */
export const SENTRY_DSN_ENV_VAR = 'SENTRY_DSN';

/** Environment variable name for the Sentry toggle. */
export const SENTRY_TOGGLE_ENV_VAR = 'TEMPOT_SENTRY';
