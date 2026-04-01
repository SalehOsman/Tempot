import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock @sentry/node BEFORE importing sentry.client
vi.mock('@sentry/node', () => ({
  init: vi.fn(),
  close: vi.fn().mockResolvedValue(true),
}));

import * as Sentry from '@sentry/node';
import { initSentry, closeSentry } from '../../src/sentry.client.js';

describe('initSentry', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.TEMPOT_SENTRY;
    delete process.env.SENTRY_DSN;
  });

  afterEach(() => {
    delete process.env.TEMPOT_SENTRY;
    delete process.env.SENTRY_DSN;
  });

  it('returns ok and does not call Sentry.init when disabled', () => {
    const result = initSentry();
    expect(result.isOk()).toBe(true);
    expect(Sentry.init).not.toHaveBeenCalled();
  });

  it('returns err when enabled but SENTRY_DSN is missing', () => {
    process.env.TEMPOT_SENTRY = 'true';
    const result = initSentry();
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.code).toBe('sentry.dsn_missing');
    }
  });

  it('calls Sentry.init with correct config when enabled', () => {
    process.env.TEMPOT_SENTRY = 'true';
    process.env.SENTRY_DSN = 'https://key@sentry.io/123';
    const result = initSentry({ environment: 'test' });
    expect(result.isOk()).toBe(true);
    expect(Sentry.init).toHaveBeenCalledWith(
      expect.objectContaining({
        dsn: 'https://key@sentry.io/123',
        environment: 'test',
      }),
    );
  });

  it('uses DSN from config parameter over env var', () => {
    process.env.TEMPOT_SENTRY = 'true';
    process.env.SENTRY_DSN = 'https://env@sentry.io/1';
    const result = initSentry({
      dsn: 'https://param@sentry.io/2',
      environment: 'staging',
    });
    expect(result.isOk()).toBe(true);
    expect(Sentry.init).toHaveBeenCalledWith(
      expect.objectContaining({
        dsn: 'https://param@sentry.io/2',
      }),
    );
  });

  it('returns err when Sentry.init throws', () => {
    process.env.TEMPOT_SENTRY = 'true';
    process.env.SENTRY_DSN = 'https://key@sentry.io/123';
    vi.mocked(Sentry.init).mockImplementationOnce(() => {
      throw new Error('SDK init failed');
    });
    const result = initSentry();
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.code).toBe('sentry.init_failed');
    }
  });

  it('applies default sample rate from constants', () => {
    process.env.TEMPOT_SENTRY = 'true';
    process.env.SENTRY_DSN = 'https://key@sentry.io/123';
    initSentry();
    expect(Sentry.init).toHaveBeenCalledWith(expect.objectContaining({ sampleRate: 1.0 }));
  });
});

describe('closeSentry', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.TEMPOT_SENTRY;
  });

  afterEach(() => {
    delete process.env.TEMPOT_SENTRY;
  });

  it('returns ok when disabled (no-op)', async () => {
    const result = await closeSentry();
    expect(result.isOk()).toBe(true);
    expect(Sentry.close).not.toHaveBeenCalled();
  });

  it('calls Sentry.close with timeout when enabled', async () => {
    process.env.TEMPOT_SENTRY = 'true';
    process.env.SENTRY_DSN = 'https://key@sentry.io/123';
    initSentry();
    const result = await closeSentry(3000);
    expect(result.isOk()).toBe(true);
    expect(Sentry.close).toHaveBeenCalledWith(3000);
  });

  it('uses default timeout when none provided', async () => {
    process.env.TEMPOT_SENTRY = 'true';
    process.env.SENTRY_DSN = 'https://key@sentry.io/123';
    initSentry();
    const result = await closeSentry();
    expect(result.isOk()).toBe(true);
    expect(Sentry.close).toHaveBeenCalledWith(2000);
  });
});
