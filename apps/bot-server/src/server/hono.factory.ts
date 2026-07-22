import { Hono } from 'hono';
import type { Context as HonoContext, Next } from 'hono';
import type { Bot, Context as GrammyContext } from 'grammy';
import { createWebhookRoute } from './routes/webhook.route.js';
import { createHealthRoute } from './routes/health.route.js';
import type { BotMode, HealthProbes, ModuleLogger } from '../bot-server.types.js';

const MAX_REQUEST_BODY_BYTES = 65_536;
const DEFAULT_RATE_LIMIT = {
  maxRequests: 60,
  windowMs: 60_000,
} as const;

export interface HttpRateLimitOptions {
  maxRequests: number;
  windowMs: number;
  trustedClientIpHeader?: TrustedClientIpHeader;
}

type TrustedClientIpHeader = 'cf-connecting-ip' | 'x-real-ip';

interface HonoFactoryDeps {
  bot: Bot<GrammyContext>;
  mode: BotMode;
  webhookSecret?: string;
  probes: HealthProbes;
  version: string;
  startTime: number;
  logger: ModuleLogger;
  readinessToken?: string;
  bodyLimitBytes?: number;
  httpRateLimit?: HttpRateLimitOptions;
}

export function createHonoApp(deps: HonoFactoryDeps): Hono {
  const { bot, mode, webhookSecret, probes, version, startTime, logger, readinessToken } = deps;
  const app = new Hono();
  const rateLimit = createRateLimitMiddleware(deps.httpRateLimit ?? DEFAULT_RATE_LIMIT);
  const bodyLimit = createBodyLimitMiddleware(deps.bodyLimitBytes ?? MAX_REQUEST_BODY_BYTES);

  app.use('*', secureHeadersMiddleware);
  app.use('*', rateLimit);
  app.use('*', bodyLimit);

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

function createRateLimitMiddleware(options: HttpRateLimitOptions) {
  const buckets = new Map<string, { count: number; resetAt: number }>();

  return async (c: HonoContext, next: Next): Promise<Response | void> => {
    if (c.req.path !== '/webhook') {
      await next();
      return;
    }

    const now = Date.now();
    const key = clientRateLimitKey(c, options.trustedClientIpHeader);
    const bucket = buckets.get(key);
    if (!bucket || bucket.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + options.windowMs });
      await next();
      return;
    }

    if (bucket.count >= options.maxRequests) {
      return c.json({ error: 'rate_limited' }, 429);
    }

    bucket.count += 1;
    await next();
  };
}

function clientRateLimitKey(
  c: HonoContext,
  trustedHeader: TrustedClientIpHeader | undefined,
): string {
  if (!trustedHeader) return 'unknown-client';
  const clientIp = c.req.header(trustedHeader)?.trim();
  return clientIp ? `${trustedHeader}:${clientIp}` : 'unknown-client';
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

function createBodyLimitMiddleware(maxBodyBytes: number) {
  return async (c: HonoContext, next: Next): Promise<Response | void> => {
    const bodySize = await requestBodySize(c);
    if (bodySize > maxBodyBytes) {
      return c.json({ error: 'payload_too_large' }, 413);
    }
    await next();
  };
}

async function requestBodySize(c: HonoContext): Promise<number> {
  if (c.req.method === 'GET' || c.req.method === 'HEAD') return 0;
  const contentLength = Number(c.req.header('content-length') ?? 0);
  if (contentLength > 0) return contentLength;
  const buffer = await c.req.raw.clone().arrayBuffer();
  return buffer.byteLength;
}
