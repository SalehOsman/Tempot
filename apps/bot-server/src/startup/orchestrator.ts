import { ok, err } from 'neverthrow';
import type { Result } from 'neverthrow';
import type { AsyncResult } from '@tempot/shared';
import { AppError } from '@tempot/shared';
import type { BotServerConfig, ModuleLogger } from '../bot-server.types.js';

interface DiscoveryResult {
  discovered: unknown[];
  skipped: unknown[];
  failed: unknown[];
}

interface ValidationResult {
  validated: unknown[];
  skipped: unknown[];
  failed: unknown[];
}

interface BotLike {
  start: () => Promise<void>;
}

interface HttpServerLike {
  listen: (port: number) => void;
  close: () => Promise<void> | void;
}

export interface OrchestratorDeps {
  loadConfig: () => Result<BotServerConfig, AppError>;
  connectDatabase: () => AsyncResult<void>;
  bootstrapSuperAdmins: (ids: number[]) => AsyncResult<void>;
  warmCaches: () => AsyncResult<void>;
  discover: () => AsyncResult<DiscoveryResult>;
  validate: () => AsyncResult<ValidationResult>;
  loadModuleHandlers: (bot: unknown, validated: unknown[]) => AsyncResult<string[]>;
  registerCommands: (bot: unknown) => AsyncResult<void>;
  createBot: (token: string) => BotLike;
  createHttpServer: (bot: unknown, config: BotServerConfig) => HttpServerLike;
  registerShutdownHooks: (httpServer: HttpServerLike, bot: BotLike) => void;
  setupSignalHandlers: () => void;
  eventBus: {
    publish: (event: string, payload: Record<string, unknown>) => Promise<unknown>;
  };
  logger: ModuleLogger;
}

export async function startApplication(deps: OrchestratorDeps): AsyncResult<void> {
  const startTime = Date.now();

  const configResult = deps.loadConfig();
  if (configResult.isErr()) {
    return err(configResult.error);
  }
  const config = configResult.value;
  deps.logger.info({ msg: 'config_loaded', mode: config.botMode });

  const fatalStepsResult = await runFatalSteps(config, deps);
  if (fatalStepsResult.isErr()) {
    return err(fatalStepsResult.error);
  }

  const { bot, loadedModules } = fatalStepsResult.value;

  const httpServer = deps.createHttpServer(bot, config);
  deps.registerShutdownHooks(httpServer, bot);
  deps.setupSignalHandlers();

  if (config.botMode === 'polling') {
    await bot.start();
  }

  httpServer.listen(config.port);
  deps.logger.info({ msg: 'http_server_listening', port: config.port });

  const durationMs = Date.now() - startTime;
  await deps.eventBus.publish('system.startup.completed', {
    durationMs,
    modulesLoaded: loadedModules.length,
    mode: config.botMode,
  });

  deps.logger.info({
    msg: 'startup_completed',
    durationMs,
    modulesLoaded: loadedModules.length,
  });

  return ok(undefined);
}

interface FatalStepsOutput {
  bot: BotLike;
  loadedModules: string[];
}

async function runFatalSteps(
  config: BotServerConfig,
  deps: OrchestratorDeps,
): AsyncResult<FatalStepsOutput> {
  const dbResult = await deps.connectDatabase();
  if (dbResult.isErr()) {
    deps.logger.error({ msg: 'database_unreachable', error: dbResult.error.code });
    return err(dbResult.error);
  }
  deps.logger.info({ msg: 'database_connected' });

  const bootstrapResult = await deps.bootstrapSuperAdmins(config.superAdminIds);
  if (bootstrapResult.isErr()) {
    deps.logger.error({ msg: 'bootstrap_failed', error: bootstrapResult.error.code });
    return err(bootstrapResult.error);
  }

  await deps.warmCaches();
  deps.logger.info({ msg: 'caches_warmed' });

  const discoveryResult = await deps.discover();
  if (discoveryResult.isErr()) {
    return err(discoveryResult.error);
  }
  deps.logger.info({
    msg: 'modules_discovered',
    count: discoveryResult.value.discovered.length,
  });

  const validationResult = await deps.validate();
  if (validationResult.isErr()) {
    deps.logger.error({ msg: 'module_validation_failed' });
    return err(validationResult.error);
  }

  const bot = deps.createBot(config.botToken);

  const handlersResult = await deps.loadModuleHandlers(bot, validationResult.value.validated);
  if (handlersResult.isErr()) {
    deps.logger.error({ msg: 'module_handler_failed', error: handlersResult.error.code });
    return err(handlersResult.error);
  }

  const registerResult = await deps.registerCommands(bot);
  if (registerResult.isErr()) {
    deps.logger.error({ msg: 'command_registration_failed' });
    return err(registerResult.error);
  }

  return ok({ bot, loadedModules: handlersResult.value });
}
