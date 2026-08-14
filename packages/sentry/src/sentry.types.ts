/**
 * Configuration for Sentry SDK initialization.
 * DSN and environment are required when toggle is enabled.
 */
export interface SentryConfig {
  /** Sentry Data Source Name. */
  dsn: string;
  /** Deployment environment (e.g. 'production', 'staging'). */
  environment: string;
  /** Application release version. */
  release?: string;
  /** Error sample rate, 0.0-1.0. Defaults to SENTRY_DEFAULT_SAMPLE_RATE (1.0). */
  sampleRate?: number;
  /** Performance tracing sample rate, 0.0-1.0. Defaults to 0 (disabled). */
  tracesSampleRate?: number;
}
