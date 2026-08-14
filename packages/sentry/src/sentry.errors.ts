/** Error codes for @tempot/sentry (Rule XXII dot-notation). */
export const SENTRY_ERRORS = {
  DSN_MISSING: 'sentry.dsn_missing',
  INIT_FAILED: 'sentry.init_failed',
  NOT_INITIALIZED: 'sentry.not_initialized',
  REPORT_FAILED: 'sentry.report_failed',
  CLOSE_FAILED: 'sentry.close_failed',
} as const;
