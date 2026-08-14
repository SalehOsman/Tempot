import { SENTRY_TOGGLE_ENV_VAR } from './sentry.constants.js';

/**
 * Inverted toggle guard for Sentry.
 *
 * Unlike the standard createToggleGuard (which defaults to enabled),
 * Sentry is DISABLED by default per Section 30 of the architecture spec.
 * Enabled ONLY when TEMPOT_SENTRY=true explicitly.
 */
export const sentryToggle = {
  isEnabled(): boolean {
    return process.env[SENTRY_TOGGLE_ENV_VAR] === 'true';
  },
  envVar: SENTRY_TOGGLE_ENV_VAR,
  packageName: 'sentry',
} as const;
