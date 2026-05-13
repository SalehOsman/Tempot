import { createHonoApp } from '../server/hono.factory.js';
import { buildHealthProbes } from './health.probes.js';
import { serve } from '@hono/node-server';
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

    let server: ReturnType<typeof serve> | undefined;

    return {
      listen: (port: number) => {
        server = serve({
          fetch: app.fetch,
          port,
        });
      },
      close: async () => {
        if (!server) return;

        await new Promise<void>((resolve, reject) => {
          server?.close((error) => {
            if (error) {
              reject(error);
              return;
            }

            resolve();
          });
        });
      },
    };
  };
}
