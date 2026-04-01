import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { sentryToggle } from '../../src/sentry.toggle.js';

describe('sentryToggle', () => {
  beforeEach(() => {
    delete process.env.TEMPOT_SENTRY;
  });

  afterEach(() => {
    delete process.env.TEMPOT_SENTRY;
  });

  it('is disabled by default when env var is not set', () => {
    expect(sentryToggle.isEnabled()).toBe(false);
  });

  it('is disabled when env var is "false"', () => {
    process.env.TEMPOT_SENTRY = 'false';
    expect(sentryToggle.isEnabled()).toBe(false);
  });

  it('is enabled when env var is "true"', () => {
    process.env.TEMPOT_SENTRY = 'true';
    expect(sentryToggle.isEnabled()).toBe(true);
  });

  it('is disabled for any value other than "true"', () => {
    process.env.TEMPOT_SENTRY = 'yes';
    expect(sentryToggle.isEnabled()).toBe(false);
  });

  it('exposes envVar property', () => {
    expect(sentryToggle.envVar).toBe('TEMPOT_SENTRY');
  });

  it('exposes packageName property', () => {
    expect(sentryToggle.packageName).toBe('sentry');
  });

  it('responds to runtime env var changes', () => {
    expect(sentryToggle.isEnabled()).toBe(false);
    process.env.TEMPOT_SENTRY = 'true';
    expect(sentryToggle.isEnabled()).toBe(true);
    delete process.env.TEMPOT_SENTRY;
    expect(sentryToggle.isEnabled()).toBe(false);
  });
});
