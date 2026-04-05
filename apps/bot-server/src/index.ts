/**
 * Tempot Bot Server — Production Entry Point
 *
 * Thin shell with zero business logic. Creates real dependency instances
 * and calls the startup orchestrator. On failure, logs and exits.
 *
 * @see specs/020-bot-server/spec.md
 * @see docs/superpowers/specs/2026-04-05-bot-server-design.md Section 2.1
 */

import { startApplication, type OrchestratorDeps } from './startup/orchestrator.js';
import type { AsyncResult } from '@tempot/shared';
import { loadConfig } from './startup/config.loader.js';
import { bootstrapSuperAdmins } from './startup/bootstrap.js';
import { warmCaches } from './startup/cache-warmer.js';
import { loadModuleHandlers } from './startup/module-loader.js';
import { createBot } from './bot/bot.factory.js';

/**
 * Build OrchestratorDeps from real infrastructure packages.
 *
 * NOTE: This function will be fully wired when all @tempot/* packages
 * are integrated. Currently uses minimal stubs for packages not yet
 * wired (logger, database, event-bus, etc.). Each stub will be
 * replaced with the real import as the application is assembled.
 */
function buildDeps(): OrchestratorDeps {
  const logger = createStubLogger();
  const eventBus = createStubEventBus();

  return {
    loadConfig,
    connectDatabase: createStubAsyncOk(),
    bootstrapSuperAdmins: (ids: number[]) =>
      bootstrapSuperAdmins(ids, {
        prisma: { session: { upsert: async () => ({}) } },
        logger,
      }),
    warmCaches: () =>
      warmCaches({
        settingsWarmer: { warmAll: async () => {} },
        i18nWarmer: { warmAll: async () => {} },
        logger,
      }),
    discover: createStubDiscovery(),
    validate: createStubValidation(),
    loadModuleHandlers: createModuleLoaderFn(logger, eventBus),
    registerCommands: createStubAsyncOkWithArg(),
    createBot: (token: string) => createBotWithStubs(token, logger, eventBus),
    createHttpServer: () => ({ listen: () => {}, close: async () => {} }),
    registerShutdownHooks: () => {},
    setupSignalHandlers: () => {},
    eventBus,
    logger,
  };
}

function createModuleLoaderFn(
  logger: OrchestratorDeps['logger'],
  eventBus: { publish: (event: string, payload: Record<string, unknown>) => Promise<unknown> },
) {
  const moduleEventBus = {
    publish: async (event: string, payload: Record<string, unknown>) => {
      await eventBus.publish(event, payload);
      return { isOk: () => true };
    },
  };
  return (bot: unknown, validated: unknown[]) =>
    loadModuleHandlers(bot, validated as Parameters<typeof loadModuleHandlers>[1], {
      logger,
      eventBus: moduleEventBus,
      sessionProvider: { getSession: async () => ({}) },
      i18n: { t: (key: string) => key },
      settings: { get: async () => null },
      importer: async (path: string) => import(path),
    });
}

function createBotWithStubs(
  token: string,
  logger: OrchestratorDeps['logger'],
  eventBus: OrchestratorDeps['eventBus'],
) {
  return createBot(token, {
    logger,
    eventBus,
    t: (key: string) => key,
    getMaintenanceStatus: async () => ({
      enabled: false,
      isSuperAdmin: () => false,
    }),
    getSessionUser: async () => null,
    abilityDefinitions: [],
    commandModuleMap: new Map(),
    auditLog: async () => {},
  });
}

function createStubLogger() {
  const logger: OrchestratorDeps['logger'] = {
    info: (data: unknown) => {
      process.stderr.write(JSON.stringify(data) + '\n');
    },
    warn: (data: unknown) => {
      process.stderr.write(JSON.stringify(data) + '\n');
    },
    error: (data: unknown) => {
      process.stderr.write(JSON.stringify(data) + '\n');
    },
    debug: () => {},
    child: () => logger,
  };
  return logger;
}

function createStubEventBus() {
  return {
    publish: async () => ({ isOk: () => true }),
  };
}

function createStubAsyncOk(): () => AsyncResult<void> {
  return async () => {
    const { ok } = await import('neverthrow');
    return ok(undefined);
  };
}

function createStubAsyncOkWithArg(): (_arg: unknown) => AsyncResult<void> {
  return async () => {
    const { ok } = await import('neverthrow');
    return ok(undefined);
  };
}

function createStubDiscovery() {
  return async () => {
    const { ok } = await import('neverthrow');
    return ok({ discovered: [], skipped: [], failed: [] });
  };
}

function createStubValidation() {
  return async () => {
    const { ok } = await import('neverthrow');
    return ok({ validated: [], skipped: [], failed: [] });
  };
}

async function main(): Promise<void> {
  const deps = buildDeps();
  const result = await startApplication(deps);

  if (result.isErr()) {
    process.stderr.write(
      JSON.stringify({
        level: 'fatal',
        module: 'bot-server',
        msg: 'startup_failed',
        error: result.error.code,
      }) + '\n',
    );
    process.exit(1);
  }
}

void main();
