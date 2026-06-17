import { Hono } from 'hono';
import type { Context as HonoContext, Next } from 'hono';
import type { Bot, Context as GrammyContext } from 'grammy';
import { createWebhookRoute } from './routes/webhook.route.js';
import { createHealthRoute } from './routes/health.route.js';
import type { BotMode, HealthProbes, ModuleLogger } from '../bot-server.types.js';

const MAX_REQUEST_BODY_BYTES = 65_536;

interface HonoFactoryDeps {
  bot: Bot<GrammyContext>;
  mode: BotMode;
  webhookSecret?: string;
  probes: HealthProbes;
  version: string;
  startTime: number;
  logger: ModuleLogger;
  readinessToken?: string;
}

export function createHonoApp(deps: HonoFactoryDeps): Hono {
  const { bot, mode, webhookSecret, probes, version, startTime, logger, readinessToken } = deps;
  const app = new Hono();

  app.use('*', secureHeadersMiddleware);
  app.use('*', bodyLimitMiddleware);

  const healthRoute = createHealthRoute({
    probes,
    version,
    startTime,
    logger: logger.child({ component: 'health' }),
    readinessToken,
  });
  app.route('/', healthRoute);

  if (mode === 'webhook' && webhookSecret) {
    const webhookRoute = createWebhookRoute({
      bot,
      webhookSecret,
      logger: logger.child({ component: 'webhook' }),
    });
    app.route('/', webhookRoute);
  }

  return app;
}

async function secureHeadersMiddleware(c: HonoContext, next: Next): Promise<void> {
  await next();
  c.header('X-Content-Type-Options', 'nosniff');
  c.header('X-Frame-Options', 'DENY');
  c.header('Referrer-Policy', 'no-referrer');
  c.header(
    'Content-Security-Policy',
    "default-src 'none'; frame-ancestors 'none'; base-uri 'none'",
  );
}

async function bodyLimitMiddleware(c: HonoContext, next: Next): Promise<Response | void> {
  const bodySize = await requestBodySize(c);
  if (bodySize > MAX_REQUEST_BODY_BYTES) {
    return c.json({ error: 'payload_too_large' }, 413);
  }
  await next();
}

async function requestBodySize(c: HonoContext): Promise<number> {
  const contentLength = Number(c.req.header('content-length') ?? 0);
  if (contentLength > 0) return contentLength;
  const buffer = await c.req.raw.clone().arrayBuffer();
  return buffer.byteLength;
}
