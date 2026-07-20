import { describe, expect, it } from 'vitest';
import { BOT_SERVER_ERRORS } from '../../src/bot-server.errors.js';
import { resolveWebhookManagerConfig } from '../../scripts/webhook-manager.config.js';

describe('resolveWebhookManagerConfig', () => {
  it('requires WEBHOOK_SECRET_TOKEN when setting a webhook', () => {
    const result = resolveWebhookManagerConfig({
      action: 'set',
      env: {
        BOT_TOKEN: 'test-token',
        BOT_MODE: 'webhook',
        WEBHOOK_URL: 'https://example.com',
      },
    });

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.code).toBe(BOT_SERVER_ERRORS.MISSING_WEBHOOK_SECRET);
    }
  });

  it('uses WEBHOOK_SECRET_TOKEN instead of a fallback secret', () => {
    const result = resolveWebhookManagerConfig({
      action: 'set',
      env: {
        BOT_TOKEN: 'test-token',
        BOT_MODE: 'webhook',
        WEBHOOK_URL: 'https://example.com',
        WEBHOOK_SECRET_TOKEN: 'real-secret',
        TEST_WEBHOOK_SECRET: 'legacy-secret',
      },
    });

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.webhookSecret).toBe('real-secret');
      expect(result.value.webhookSecret).not.toBe('fallback_secret_token');
    }
  });
});
