import { describe, expect, it, vi } from 'vitest';
import { createHonoApp } from '../../src/server/hono.factory.js';
import type { HealthProbes, ModuleLogger, SubsystemCheck } from '../../src/bot-server.types.js';

function createMockLogger(): ModuleLogger {
  return {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    child: vi.fn().mockReturnThis(),
  };
}

function okCheck(): Promise<SubsystemCheck> {
  return Promise.resolve({ status: 'ok' });
}

function createProbes(): HealthProbes {
  return {
    database: vi.fn(okCheck),
    redis: vi.fn(okCheck),
    ai_provider: vi.fn(okCheck),
    disk: vi.fn(okCheck),
    queue_manager: vi.fn(okCheck),
  };
}

function createApp(options: { bodyLimitBytes?: number; rateLimitMaxRequests?: number } = {}) {
  const bot = { handleUpdate: vi.fn().mockResolvedValue(undefined) };
  const app = createHonoApp({
    bot: bot as never,
    mode: 'webhook',
    webhookSecret: 'test-secret-token',
    probes: createProbes(),
    version: '1.0.0',
    startTime: Date.now(),
    logger: createMockLogger(),
    readinessToken: 'ops-token',
    bodyLimitBytes: options.bodyLimitBytes,
    httpRateLimit:
      options.rateLimitMaxRequests === undefined
        ? undefined
        : { maxRequests: options.rateLimitMaxRequests, windowMs: 60_000 },
  });
  return { app, bot };
}

describe('createHonoApp hardening', () => {
  it('applies secure headers to public liveness responses', async () => {
    const { app } = createApp();

    const response = await app.request('/health');

    expect(response.headers.get('x-content-type-options')).toBe('nosniff');
    expect(response.headers.get('x-frame-options')).toBe('DENY');
    expect(response.headers.get('referrer-policy')).toBe('no-referrer');
    expect(response.headers.get('content-security-policy')).toContain("default-src 'none'");
  });

  it('does not enable wildcard CORS on public endpoints', async () => {
    const { app } = createApp();

    const response = await app.request('/health', {
      headers: { Origin: 'https://attacker.example' },
    });

    expect(response.headers.get('access-control-allow-origin')).not.toBe('*');
  });

  it('rejects oversized webhook payloads before bot processing', async () => {
    const { app, bot } = createApp();
    const oversizedBody = JSON.stringify({ update_id: 1, message: { text: 'x'.repeat(70_000) } });

    const response = await app.request('/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Telegram-Bot-Api-Secret-Token': 'test-secret-token',
      },
      body: oversizedBody,
    });

    expect(response.status).toBe(413);
    expect(await response.json()).toEqual({ error: 'payload_too_large' });
    expect(bot.handleUpdate).not.toHaveBeenCalled();
  });

  it('uses configured body limits for webhook payloads', async () => {
    const { app, bot } = createApp({ bodyLimitBytes: 128 });
    const body = JSON.stringify({ update_id: 1, message: { text: 'x'.repeat(200) } });

    const response = await app.request('/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Telegram-Bot-Api-Secret-Token': 'test-secret-token',
      },
      body,
    });

    expect(response.status).toBe(413);
    expect(bot.handleUpdate).not.toHaveBeenCalled();
  });

  it('rate limits webhook requests before repeated bot processing', async () => {
    const { app, bot } = createApp({ rateLimitMaxRequests: 1 });
    const headers = {
      'Content-Type': 'application/json',
      'X-Telegram-Bot-Api-Secret-Token': 'test-secret-token',
    };

    const first = await app.request('/webhook', {
      method: 'POST',
      headers,
      body: JSON.stringify({ update_id: 1, message: { text: 'first' } }),
    });
    const second = await app.request('/webhook', {
      method: 'POST',
      headers,
      body: JSON.stringify({ update_id: 2, message: { text: 'second' } }),
    });

    expect(first.status).toBe(200);
    expect(second.status).toBe(429);
    expect(await second.json()).toEqual({ error: 'rate_limited' });
    expect(bot.handleUpdate).toHaveBeenCalledOnce();
  });
});
