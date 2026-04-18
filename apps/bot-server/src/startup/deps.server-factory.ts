import { createHonoApp } from '../server/hono.factory.js';
import { buildHealthProbes } from './health.probes.js';
import type { EventBusOrchestrator } from '@tempot/event-bus';
import type { CacheService } from '@tempot/shared';
import type { SettingsService } from '@tempot/settings';
import { prisma } from '@tempot/database';
import type { OrchestratorDeps } from './orchestrator.js';
import type { BotServerConfig } from '../bot-server.types.js';

export interface ServerFactoryDeps {
  log: typeof import('@tempot/logger').logger;
  eventBus: EventBusOrchestrator;
  cache: CacheService;
  settingsService: SettingsService;
}

export function buildHttpServerFactory(
  deps: ServerFactoryDeps,
): OrchestratorDeps['createHttpServer'] {
  return (bot, config: BotServerConfig) => {
    const probes = buildHealthProbes({ prisma, cache: deps.cache });
    const version = process.env['npm_package_version'] ?? '0.0.0';
    const startTime = Date.now();

    const app = createHonoApp({
      bot: bot as import('grammy').Bot<import('grammy').Context>,
      mode: config.botMode,
      webhookSecret: config.webhookSecret,
      probes,
      version,
      startTime,
      logger: deps.log,
    });

    return {
      listen: (port: number) => {
        import('node:http')
          .then(({ createServer }) => {
            const server = createServer(async (req, res) => {
              const response = await app.fetch(req as unknown as Request);
              res.writeHead(response.status);
              res.end(await response.text());
            });
            server.listen(port);
          })
          .catch((e: unknown) =>
            deps.log.error({ msg: 'http_server_listen_failed', error: String(e) }),
          );
      },
      close: async () => {},
    };
  };
}
