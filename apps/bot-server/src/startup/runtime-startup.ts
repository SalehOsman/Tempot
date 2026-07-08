import { ok, err } from 'neverthrow';
import type { Result } from 'neverthrow';
import type { AsyncResult, AppError } from '@tempot/shared';
import { AppError as RuntimeAppError } from '@tempot/shared';
import type { BotServerConfig } from '../bot-server.types.js';
import { BOT_SERVER_ERRORS } from '../bot-server.errors.js';
import type { OrchestratorDeps } from './orchestrator.js';
import type { StartupStageName } from './startup-state.js';

type BotLike = ReturnType<OrchestratorDeps['createBot']>;
type HttpServerLike = ReturnType<OrchestratorDeps['createHttpServer']>;

export async function initializeWebhookBot(
  deps: OrchestratorDeps,
  bot: BotLike,
): AsyncResult<void> {
  deps.startupState.markStarted('botWebhook');
  if (typeof bot.init !== 'function') {
    const appError = new RuntimeAppError(BOT_SERVER_ERRORS.STARTUP_FAILED, {
      stage: 'botWebhook',
      error: 'bot.init unavailable',
    });
    failStartupStage(deps, 'botWebhook', appError);
    return err(appError);
  }

  try {
    await bot.init();
    deps.startupState.markReady('botWebhook');
    return ok(undefined);
  } catch (error: unknown) {
    const appError = new RuntimeAppError(BOT_SERVER_ERRORS.STARTUP_FAILED, {
      stage: 'botWebhook',
      error: errorMessage(error),
    });
    failStartupStage(deps, 'botWebhook', appError);
    return err(appError);
  }
}

export async function startHttpServer(
  deps: OrchestratorDeps,
  bot: BotLike,
  config: BotServerConfig,
): AsyncResult<HttpServerLike> {
  deps.startupState.markStarted('httpServer');
  const httpServerResult = createHttpServer(deps, bot, config);
  if (httpServerResult.isErr()) {
    failStartupStage(deps, 'httpServer', httpServerResult.error);
    return err(httpServerResult.error);
  }

  const hookResult = await registerRuntimeHooks(deps, httpServerResult.value, bot);
  if (hookResult.isErr()) return err(hookResult.error);

  const listenResult = listenHttpServer(httpServerResult.value, config.port);
  if (listenResult.isErr()) {
    failStartupStage(deps, 'httpServer', listenResult.error);
    await closeHttpServer(deps, httpServerResult.value);
    return err(listenResult.error);
  }
  deps.startupState.markReady('httpServer');
  deps.startupState.activateReadiness();
  deps.logger.info({ msg: 'http_server_listening', port: config.port });
  return ok(httpServerResult.value);
}

export async function startPolling(
  deps: OrchestratorDeps,
  bot: BotLike,
  httpServer: HttpServerLike,
): AsyncResult<void> {
  deps.startupState.markStarted('botPolling');
  try {
    await bot.start();
    deps.startupState.markReady('botPolling');
    return ok(undefined);
  } catch (error: unknown) {
    const appError = new RuntimeAppError(BOT_SERVER_ERRORS.STARTUP_FAILED, {
      stage: 'botPolling',
      error: errorMessage(error),
    });
    failStartupStage(deps, 'botPolling', appError);
    await closeHttpServer(deps, httpServer);
    return err(appError);
  }
}

function createHttpServer(
  deps: OrchestratorDeps,
  bot: BotLike,
  config: BotServerConfig,
): Result<HttpServerLike, AppError> {
  try {
    return ok(deps.createHttpServer(bot, config));
  } catch (error: unknown) {
    return err(
      new RuntimeAppError(BOT_SERVER_ERRORS.HTTP_SERVER_FAILED, { error: errorMessage(error) }),
    );
  }
}

async function registerRuntimeHooks(
  deps: OrchestratorDeps,
  httpServer: HttpServerLike,
  bot: BotLike,
): AsyncResult<void> {
  const shutdownResult = registerShutdownHooks(deps, httpServer, bot);
  if (shutdownResult.isErr()) {
    await closeHttpServer(deps, httpServer);
    return err(shutdownResult.error);
  }

  const signalResult = registerSignalHandlers(deps);
  if (signalResult.isErr()) {
    await closeHttpServer(deps, httpServer);
    return err(signalResult.error);
  }
  return ok(undefined);
}

function registerShutdownHooks(
  deps: OrchestratorDeps,
  httpServer: HttpServerLike,
  bot: BotLike,
): Result<void, AppError> {
  deps.startupState.markStarted('shutdownHooks');
  const shutdownResult = deps.registerShutdownHooks(httpServer, bot);
  if (shutdownResult.isErr()) {
    failStartupStage(deps, 'shutdownHooks', shutdownResult.error);
    return err(shutdownResult.error);
  }
  deps.startupState.markReady('shutdownHooks');
  return ok(undefined);
}

function registerSignalHandlers(deps: OrchestratorDeps): Result<void, AppError> {
  deps.startupState.markStarted('signalHandlers');
  const signalResult = deps.setupSignalHandlers();
  if (signalResult.isErr()) {
    failStartupStage(deps, 'signalHandlers', signalResult.error);
    return err(signalResult.error);
  }
  deps.startupState.markReady('signalHandlers');
  return ok(undefined);
}

function listenHttpServer(httpServer: HttpServerLike, port: number): Result<void, AppError> {
  try {
    httpServer.listen(port);
    return ok(undefined);
  } catch (error: unknown) {
    return err(
      new RuntimeAppError(BOT_SERVER_ERRORS.HTTP_SERVER_FAILED, { error: errorMessage(error) }),
    );
  }
}

async function closeHttpServer(deps: OrchestratorDeps, httpServer: HttpServerLike): Promise<void> {
  try {
    await httpServer.close();
  } catch (error: unknown) {
    deps.logger.warn({ msg: 'startup_shutdown_failed', error: errorMessage(error) });
  }
}

function failStartupStage(deps: OrchestratorDeps, stage: StartupStageName, error: AppError): void {
  deps.startupState.markFailed(stage, error.code);
  deps.startupState.deactivateReadiness();
  deps.logger.error({ msg: 'startup_failed', stage, error: error.code });
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
