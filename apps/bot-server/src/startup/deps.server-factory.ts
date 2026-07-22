import { createHonoApp, type HttpRateLimitOptions } from '../server/hono.factory.js';
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
    const probes = buildHealthProbes({
      prisma,
      cache: deps.cache,
      diskFreeThresholdBytes: positiveIntegerEnv('TEMPOT_DISK_FREE_THRESHOLD_BYTES'),
    });
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
      readinessToken: process.env['TEMPOT_READINESS_TOKEN'],
      bodyLimitBytes: positiveIntegerEnv('TEMPOT_HTTP_BODY_LIMIT_BYTES'),
      httpRateLimit: buildHttpRateLimitFromEnv(),
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

function buildHttpRateLimitFromEnv(): HttpRateLimitOptions | undefined {
  const maxRequests = positiveIntegerEnv('TEMPOT_HTTP_RATE_LIMIT_MAX');
  const windowMs = positiveIntegerEnv('TEMPOT_HTTP_RATE_LIMIT_WINDOW_MS');
  const trustedClientIpHeader = trustedClientIpHeaderEnv();
  if (maxRequests === undefined && windowMs === undefined && !trustedClientIpHeader)
    return undefined;
  return {
    maxRequests: maxRequests ?? 60,
    windowMs: windowMs ?? 60_000,
    trustedClientIpHeader,
  };
}

function trustedClientIpHeaderEnv(): 'cf-connecting-ip' | 'x-real-ip' | undefined {
  const raw = process.env['TEMPOT_HTTP_TRUSTED_CLIENT_IP_HEADER'];
  if (raw === 'cf-connecting-ip' || raw === 'x-real-ip') return raw;
  return undefined;
}

function positiveIntegerEnv(name: string): number | undefined {
  const raw = process.env[name];
  if (!raw) return undefined;
  const value = Number(raw);
  return Number.isSafeInteger(value) && value > 0 ? value : undefined;
}
