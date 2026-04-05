import { describe, it, expect, beforeEach } from 'vitest';
import { loadConfig } from '../../src/startup/config.loader.js';
import { BOT_SERVER_ERRORS } from '../../src/bot-server.errors.js';

const ENV_KEYS = [
  'BOT_TOKEN',
  'BOT_MODE',
  'PORT',
  'WEBHOOK_URL',
  'WEBHOOK_SECRET',
  'SUPER_ADMIN_IDS',
];

function clearEnv(): void {
  for (const key of ENV_KEYS) {
    delete process.env[key];
  }
}

describe('loadConfig', () => {
  beforeEach(() => {
    clearEnv();
  });

  it('returns err with MISSING_BOT_TOKEN when BOT_TOKEN is not set', () => {
    process.env['BOT_MODE'] = 'polling';

    const result = loadConfig();

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.code).toBe(BOT_SERVER_ERRORS.MISSING_BOT_TOKEN);
    }
  });

  it('returns err with INVALID_BOT_MODE when BOT_MODE is invalid', () => {
    process.env['BOT_TOKEN'] = 'test-token';
    process.env['BOT_MODE'] = 'invalid';

    const result = loadConfig();

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.code).toBe(BOT_SERVER_ERRORS.INVALID_BOT_MODE);
    }
  });

  it('returns ok with correct config for valid polling mode', () => {
    process.env['BOT_TOKEN'] = 'test-token';
    process.env['BOT_MODE'] = 'polling';

    const result = loadConfig();

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value).toEqual({
        botToken: 'test-token',
        botMode: 'polling',
        port: 3000,
        superAdminIds: [],
      });
    }
  });

  it('returns ok with correct config for valid webhook mode', () => {
    process.env['BOT_TOKEN'] = 'test-token';
    process.env['BOT_MODE'] = 'webhook';
    process.env['WEBHOOK_URL'] = 'https://example.com/webhook';
    process.env['WEBHOOK_SECRET'] = 'secret-value';

    const result = loadConfig();

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value).toEqual({
        botToken: 'test-token',
        botMode: 'webhook',
        port: 3000,
        webhookUrl: 'https://example.com/webhook',
        webhookSecret: 'secret-value',
        superAdminIds: [],
      });
    }
  });

  it('returns err with MISSING_WEBHOOK_URL when webhook mode lacks URL', () => {
    process.env['BOT_TOKEN'] = 'test-token';
    process.env['BOT_MODE'] = 'webhook';
    process.env['WEBHOOK_SECRET'] = 'secret-value';

    const result = loadConfig();

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.code).toBe(BOT_SERVER_ERRORS.MISSING_WEBHOOK_URL);
    }
  });

  it('returns err with MISSING_WEBHOOK_SECRET when webhook mode lacks secret', () => {
    process.env['BOT_TOKEN'] = 'test-token';
    process.env['BOT_MODE'] = 'webhook';
    process.env['WEBHOOK_URL'] = 'https://example.com/webhook';

    const result = loadConfig();

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.code).toBe(BOT_SERVER_ERRORS.MISSING_WEBHOOK_SECRET);
    }
  });

  it('parses SUPER_ADMIN_IDS as comma-separated numbers', () => {
    process.env['BOT_TOKEN'] = 'test-token';
    process.env['BOT_MODE'] = 'polling';
    process.env['SUPER_ADMIN_IDS'] = '123,456';

    const result = loadConfig();

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.superAdminIds).toEqual([123, 456]);
    }
  });

  it('returns err with INVALID_SUPER_ADMIN_IDS for non-numeric values', () => {
    process.env['BOT_TOKEN'] = 'test-token';
    process.env['BOT_MODE'] = 'polling';
    process.env['SUPER_ADMIN_IDS'] = 'abc,def';

    const result = loadConfig();

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.code).toBe(BOT_SERVER_ERRORS.INVALID_SUPER_ADMIN_IDS);
    }
  });

  it('returns ok with empty array when SUPER_ADMIN_IDS is empty string', () => {
    process.env['BOT_TOKEN'] = 'test-token';
    process.env['BOT_MODE'] = 'polling';
    process.env['SUPER_ADMIN_IDS'] = '';

    const result = loadConfig();

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.superAdminIds).toEqual([]);
    }
  });

  it('returns ok with empty array when SUPER_ADMIN_IDS is not set', () => {
    process.env['BOT_TOKEN'] = 'test-token';
    process.env['BOT_MODE'] = 'polling';

    const result = loadConfig();

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.superAdminIds).toEqual([]);
    }
  });

  it('defaults port to 3000 when PORT is not set', () => {
    process.env['BOT_TOKEN'] = 'test-token';
    process.env['BOT_MODE'] = 'polling';

    const result = loadConfig();

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.port).toBe(3000);
    }
  });

  it('parses PORT as number when set', () => {
    process.env['BOT_TOKEN'] = 'test-token';
    process.env['BOT_MODE'] = 'polling';
    process.env['PORT'] = '8080';

    const result = loadConfig();

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.port).toBe(8080);
    }
  });

  it('returns err with INVALID_PORT for non-numeric PORT', () => {
    process.env['BOT_TOKEN'] = 'test-token';
    process.env['BOT_MODE'] = 'polling';
    process.env['PORT'] = 'abc';

    const result = loadConfig();

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.code).toBe(BOT_SERVER_ERRORS.INVALID_PORT);
    }
  });

  it('returns err with INVALID_PORT for out-of-range PORT', () => {
    process.env['BOT_TOKEN'] = 'test-token';
    process.env['BOT_MODE'] = 'polling';
    process.env['PORT'] = '99999';

    const result = loadConfig();

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.code).toBe(BOT_SERVER_ERRORS.INVALID_PORT);
    }
  });

  it('returns err with INVALID_PORT for PORT of 0', () => {
    process.env['BOT_TOKEN'] = 'test-token';
    process.env['BOT_MODE'] = 'polling';
    process.env['PORT'] = '0';

    const result = loadConfig();

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.code).toBe(BOT_SERVER_ERRORS.INVALID_PORT);
    }
  });
});
