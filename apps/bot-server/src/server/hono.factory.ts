import { Hono } from 'hono';
import type { Bot, Context as GrammyContext } from 'grammy';
import { createWebhookRoute } from './routes/webhook.route.js';
import { createHealthRoute } from './routes/health.route.js';
import type { BotMode, HealthProbes, ModuleLogger } from '../bot-server.types.js';

interface HonoFactoryDeps {
  bot: Bot<GrammyContext>;
  mode: BotMode;
  webhookSecret?: string;
  probes: HealthProbes;
  version: string;
  startTime: number;
  logger: ModuleLogger;
}

export function createHonoApp(deps: HonoFactoryDeps): Hono {
  const { bot, mode, webhookSecret, probes, version, startTime, logger } = deps;
  const app = new Hono();

  const healthRoute = createHealthRoute({
    probes,
    version,
    startTime,
    logger: logger.child({ component: 'health' }),
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
