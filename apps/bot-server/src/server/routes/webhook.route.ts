import { Hono } from 'hono';
import { timingSafeEqual } from 'node:crypto';
import type { Context as HonoContext } from 'hono';
import type { Bot, Context as GrammyContext } from 'grammy';
import type { Update } from 'grammy/types';
import type { ModuleLogger } from '../../bot-server.types.js';

interface WebhookRouteDeps {
  bot: Bot<GrammyContext>;
  webhookSecret: string;
  logger: ModuleLogger;
}

const TELEGRAM_SECRET_HEADER = 'x-telegram-bot-api-secret-token';

export function createWebhookRoute(deps: WebhookRouteDeps): Hono {
  const route = new Hono();
  const { bot, webhookSecret, logger } = deps;

  route.post('/webhook', async (c: HonoContext) => {
    if (!verifySecret(c, webhookSecret)) {
      logger.warn({ msg: 'webhook_unauthorized' });
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const body = await parseBody(c);
    if (body === null) {
      logger.warn({ msg: 'webhook_invalid_body' });
      return c.json({ error: 'Bad Request' }, 400);
    }

    if (!isValidUpdate(body)) {
      logger.warn({ msg: 'webhook_missing_update_id' });
      return c.json({ error: 'Bad Request' }, 400);
    }

    await bot.handleUpdate(body);
    return c.json({ ok: true }, 200);
  });

  route.all('/webhook', (c: HonoContext) => {
    return c.json({ error: 'Method Not Allowed' }, 405);
  });

  return route;
}

function verifySecret(c: HonoContext, expected: string): boolean {
  const received = c.req.header(TELEGRAM_SECRET_HEADER);
  if (!received) return false;

  const expectedBuf = Buffer.from(expected, 'utf8');
  const receivedBuf = Buffer.from(received, 'utf8');

  if (expectedBuf.length !== receivedBuf.length) return false;
  return timingSafeEqual(expectedBuf, receivedBuf);
}

async function parseBody(c: HonoContext): Promise<Record<string, unknown> | null> {
  const contentType = c.req.header('content-type') ?? '';
  if (!contentType.includes('application/json')) {
    return null;
  }

  try {
    return (await c.req.json()) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function isValidUpdate(body: Record<string, unknown>): body is Record<string, unknown> & Update {
  return typeof body['update_id'] === 'number';
}
