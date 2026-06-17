import { ok, err } from 'neverthrow';
import type { Result } from 'neverthrow';
import type { AsyncResult } from '@tempot/shared';
import { AppError } from '@tempot/shared';
import type { DiscoveryResult, ValidationResult, ValidatedModule } from '@tempot/module-registry';
import type { BotServerConfig, ModuleLogger } from '../bot-server.types.js';
import { BOT_SERVER_ERRORS } from '../bot-server.errors.js';
import type { StartupStageName, StartupStateStore } from './startup-state.js';
import { runFatalStartupSteps } from './fatal-startup-steps.js';

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
  loadModuleHandlers: (bot: BotLike, validated: ValidatedModule[]) => AsyncResult<string[]>;
  registerCommands: (bot: BotLike) => AsyncResult<void>;
  createBot: (token: string, validatedModules?: ValidatedModule[]) => BotLike;
  createHttpServer: (bot: BotLike, config: BotServerConfig) => HttpServerLike;
  registerShutdownHooks: (httpServer: HttpServerLike, bot: BotLike) => Result<void, AppError>;
  setupSignalHandlers: () => Result<void, AppError>;
  eventBus: {
    publish: (event: string, payload: Record<string, unknown>) => Promise<unknown>;
  };
  startupState: StartupStateStore;
  logger: ModuleLogger;
}

export async function startApplication(deps: OrchestratorDeps): AsyncResult<void> {
  const startTime = Date.now();

  const configResult = loadStartupConfig(deps);
  if (configResult.isErr()) {
    return err(configResult.error);
  }
  const config = configResult.value;

  const fatalStepsResult = await runFatalStartupSteps(config, deps);
  if (fatalStepsResult.isErr()) {
    return err(fatalStepsResult.error);
  }

  const { bot, loadedModules } = fatalStepsResult.value;
  const serverResult = startHttpServer(deps, bot, config);
  if (serverResult.isErr()) return err(serverResult.error);

  const durationMs = Date.now() - startTime;
  publishStartupCompleted(deps, {
    durationMs,
    modulesLoaded: loadedModules.length,
    mode: config.botMode,
  });

  deps.logger.info({
    msg: 'startup_completed',
    durationMs,
    modulesLoaded: loadedModules.length,
  });

  if (config.botMode === 'polling') {
    deps.startupState.markStarted('botPolling');
    await bot.start();
    deps.startupState.markReady('botPolling');
  }

  return ok(undefined);
}

function loadStartupConfig(deps: OrchestratorDeps): Result<BotServerConfig, AppError> {
  deps.startupState.markStarted('config');
  const configResult = deps.loadConfig();
  if (configResult.isErr()) {
    markFailedAndDeactivate(deps, 'config', configResult.error.code);
    return err(configResult.error);
  }
  deps.startupState.markReady('config');
  deps.logger.info({ msg: 'config_loaded', mode: configResult.value.botMode });
  return ok(configResult.value);
}

function startHttpServer(
  deps: OrchestratorDeps,
  bot: BotLike,
  config: BotServerConfig,
): Result<void, AppError> {
  deps.startupState.markStarted('httpServer');
  const httpServerResult = createHttpServer(deps, bot, config);
  if (httpServerResult.isErr()) {
    markFailedAndDeactivate(deps, 'httpServer', httpServerResult.error.code);
    return err(httpServerResult.error);
  }

  const hookResult = registerRuntimeHooks(deps, httpServerResult.value, bot);
  if (hookResult.isErr()) return err(hookResult.error);

  const listenResult = listenHttpServer(httpServerResult.value, config.port);
  if (listenResult.isErr()) {
    markFailedAndDeactivate(deps, 'httpServer', listenResult.error.code);
    return err(listenResult.error);
  }
  deps.startupState.markReady('httpServer');
  deps.startupState.activateReadiness();
  deps.logger.info({ msg: 'http_server_listening', port: config.port });
  return ok(undefined);
}

function registerRuntimeHooks(
  deps: OrchestratorDeps,
  httpServer: HttpServerLike,
  bot: BotLike,
): Result<void, AppError> {
  deps.startupState.markStarted('shutdownHooks');
  const shutdownResult = deps.registerShutdownHooks(httpServer, bot);
  if (shutdownResult.isErr()) {
    markFailedAndDeactivate(deps, 'shutdownHooks', shutdownResult.error.code);
    return err(shutdownResult.error);
  }
  deps.startupState.markReady('shutdownHooks');

  deps.startupState.markStarted('signalHandlers');
  const signalResult = deps.setupSignalHandlers();
  if (signalResult.isErr()) {
    markFailedAndDeactivate(deps, 'signalHandlers', signalResult.error.code);
    return err(signalResult.error);
  }
  deps.startupState.markReady('signalHandlers');
  return ok(undefined);
}

function createHttpServer(
  deps: OrchestratorDeps,
  bot: BotLike,
  config: BotServerConfig,
): Result<HttpServerLike, AppError> {
  try {
    return ok(deps.createHttpServer(bot, config));
  } catch (error: unknown) {
    return err(new AppError(BOT_SERVER_ERRORS.HTTP_SERVER_FAILED, { error: errorMessage(error) }));
  }
}

function listenHttpServer(httpServer: HttpServerLike, port: number): Result<void, AppError> {
  try {
    httpServer.listen(port);
    return ok(undefined);
  } catch (error: unknown) {
    return err(new AppError(BOT_SERVER_ERRORS.HTTP_SERVER_FAILED, { error: errorMessage(error) }));
  }
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function publishStartupCompleted(deps: OrchestratorDeps, payload: Record<string, unknown>): void {
  deps.eventBus
    .publish('system.startup.completed', payload)
    .then((result: unknown) => {
      if (isFailedPublish(result)) {
        deps.logger.warn({ msg: 'startup_completed_event_publish_failed' });
      }
    })
    .catch((error: unknown) => {
      deps.logger.warn({
        msg: 'startup_completed_event_publish_failed',
        error: error instanceof Error ? error.message : String(error),
      });
    });
}

function isFailedPublish(value: unknown): boolean {
  return typeof value === 'object' && value !== null && 'isOk' in value
    ? !(value as { isOk: () => boolean }).isOk()
    : false;
}

function markFailedAndDeactivate(
  deps: OrchestratorDeps,
  stage: StartupStageName,
  errorCode: string,
): void {
  deps.startupState.markFailed(stage, errorCode);
  deps.startupState.deactivateReadiness();
}
