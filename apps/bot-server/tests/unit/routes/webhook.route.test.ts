import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Hono } from 'hono';
import { createWebhookRoute } from '../../../src/server/routes/webhook.route.js';
import type { ModuleLogger } from '../../../src/bot-server.types.js';

function createMockLogger(): ModuleLogger {
  return {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    child: vi.fn().mockReturnThis(),
  };
}

interface WebhookRouteDeps {
  bot: { handleUpdate: ReturnType<typeof vi.fn> };
  webhookSecret: string;
  logger: ModuleLogger;
}

function createTestApp(deps: WebhookRouteDeps): Hono {
  const app = new Hono();
  const route = createWebhookRoute({
    bot: deps.bot as never,
    webhookSecret: deps.webhookSecret,
    logger: deps.logger,
  });
  app.route('/', route);
  return app;
}

describe('createWebhookRoute', () => {
  let deps: WebhookRouteDeps;

  beforeEach(() => {
    deps = {
      bot: { handleUpdate: vi.fn().mockResolvedValue(undefined) },
      webhookSecret: 'test-secret-token',
      logger: createMockLogger(),
    };
  });

  it('returns 200 with valid secret header and JSON body', async () => {
    const app = createTestApp(deps);

    const response = await app.request('/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Telegram-Bot-Api-Secret-Token': 'test-secret-token',
      },
      body: JSON.stringify({ update_id: 1, message: { text: 'hello' } }),
    });

    expect(response.status).toBe(200);
    expect(deps.bot.handleUpdate).toHaveBeenCalledOnce();
  });

  it('returns 401 when secret header is missing', async () => {
    const app = createTestApp(deps);

    const response = await app.request('/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ update_id: 1 }),
    });

    expect(response.status).toBe(401);
    expect(deps.bot.handleUpdate).not.toHaveBeenCalled();
  });

  it('returns 401 when secret header is wrong', async () => {
    const app = createTestApp(deps);

    const response = await app.request('/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Telegram-Bot-Api-Secret-Token': 'wrong-secret',
      },
      body: JSON.stringify({ update_id: 1 }),
    });

    expect(response.status).toBe(401);
    expect(deps.bot.handleUpdate).not.toHaveBeenCalled();
  });

  it('returns 405 for non-POST methods', async () => {
    const app = createTestApp(deps);

    const response = await app.request('/webhook', {
      method: 'GET',
    });

    expect(response.status).toBe(405);
    expect(deps.bot.handleUpdate).not.toHaveBeenCalled();
  });

  it('returns 400 for non-JSON body', async () => {
    const app = createTestApp(deps);

    const response = await app.request('/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
        'X-Telegram-Bot-Api-Secret-Token': 'test-secret-token',
      },
      body: 'not json',
    });

    expect(response.status).toBe(400);
    expect(deps.bot.handleUpdate).not.toHaveBeenCalled();
  });
});
