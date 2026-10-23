import * as crypto from 'node:crypto';
import { ok } from '@tembot/shared-types';
import { describe, expect, it, vi } from 'vitest';
import { createApp } from '../src/app.js';

describe('Tembot Hono API Gateway', () => {
  const BOT_TOKEN = 'test_token_12345';

  function signTelegramData(params: Record<string, string>): string {
    const pairs: string[] = [];
    for (const [key, value] of Object.entries(params)) {
      pairs.push(`${key}=${value}`);
    }
    pairs.sort();
    const dataCheckString = pairs.join('\n');

    const secretKey = crypto.createHmac('sha256', 'WebAppData').update(BOT_TOKEN).digest();
    const hash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

    const searchParams = new URLSearchParams(params);
    searchParams.set('hash', hash);
    return searchParams.toString();
  }

  it('serves /health endpoint with 200 OK', async () => {
    const app = createApp({ botToken: BOT_TOKEN });
    const res = await app.request('/health');

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('ok');
    expect(body.service).toBe('tembot-gateway');
  });

  it('authenticates valid Telegram initData payload at /api/v1/auth/telegram', async () => {
    const app = createApp({ botToken: BOT_TOKEN });
    const raw = signTelegramData({
      auth_date: String(Math.floor(Date.now() / 1000)),
      user: JSON.stringify({ id: 12345, first_name: 'Saleh' }),
    });

    const res = await app.request('/api/v1/auth/telegram', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ initData: raw }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('authenticated');
    expect(body.user.first_name).toBe('Saleh');
    expect(body.actor.type).toBe('telegram_user');
  });

  it('rejects tampered Telegram payload with 401 Unauthorized', async () => {
    const app = createApp({ botToken: BOT_TOKEN });
    const res = await app.request('/api/v1/auth/telegram', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ initData: 'auth_date=100&hash=invalid_hash' }),
    });

    expect(res.status).toBe(401);
  });

  it('fetches system settings via /api/v1/settings', async () => {
    const mockSettingsService = {
      getSettings: vi.fn().mockResolvedValue(
        ok({
          platformName: 'Tembot Gateway',
          botWelcomeMessage: 'Welcome to Bot',
          isGlobalMaintenance: false,
        }),
      ),
    };

    const app = createApp({
      botToken: BOT_TOKEN,
      settingsService: mockSettingsService as never,
    });

    const res = await app.request('/api/v1/settings');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.settings.platformName).toBe('Tembot Gateway');
  });
});
