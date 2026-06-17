import { ok, err } from 'neverthrow';
import type { AsyncResult } from '@tempot/shared';
import type { ValidationResult } from '@tempot/module-registry';
import type { BotServerConfig } from '../bot-server.types.js';
import type { OrchestratorDeps } from './orchestrator.js';
import type { StartupStageName } from './startup-state.js';

interface FatalStepsOutput {
  bot: ReturnType<OrchestratorDeps['createBot']>;
  loadedModules: string[];
}

export async function runFatalStartupSteps(
  config: BotServerConfig,
  deps: OrchestratorDeps,
): AsyncResult<FatalStepsOutput> {
  const databaseResult = await runFatalStage(deps, 'database', deps.connectDatabase);
  if (databaseResult.isErr()) {
    deps.logger.error({ msg: 'database_unreachable', error: databaseResult.error.code });
    return err(databaseResult.error);
  }
  deps.logger.info({ msg: 'database_connected' });

  const bootstrapResult = await runFatalStage(deps, 'superAdmins', () =>
    deps.bootstrapSuperAdmins(config.superAdminIds),
  );
  if (bootstrapResult.isErr()) {
    deps.logger.error({ msg: 'bootstrap_failed', error: bootstrapResult.error.code });
    return err(bootstrapResult.error);
  }

  await runCacheStage(deps);
  const validationResult = await runModuleDiscoveryAndValidation(deps);
  if (validationResult.isErr()) {
    return err(validationResult.error);
  }

  const bot = deps.createBot(config.botToken, validationResult.value.validated);
  const handlersResult = await runFatalStage(deps, 'moduleHandlers', () =>
    deps.loadModuleHandlers(bot, validationResult.value.validated),
  );
  if (handlersResult.isErr()) {
    deps.logger.error({ msg: 'module_handler_failed', error: handlersResult.error.code });
    return err(handlersResult.error);
  }

  const registerResult = await runFatalStage(deps, 'commandRegistration', () =>
    deps.registerCommands(bot),
  );
  if (registerResult.isErr()) {
    deps.logger.error({ msg: 'command_registration_failed' });
    return err(registerResult.error);
  }

  return ok({ bot, loadedModules: handlersResult.value });
}

async function runCacheStage(deps: OrchestratorDeps): Promise<void> {
  deps.startupState.markStarted('cache');
  const cacheResult = await deps.warmCaches();
  if (cacheResult.isErr()) {
    deps.startupState.markDegraded('cache', cacheResult.error.code);
    deps.logger.warn({ msg: 'cache_warming_failed', error: cacheResult.error.code });
    return;
  }
  deps.startupState.markReady('cache');
  deps.logger.info({ msg: 'caches_warmed' });
}

async function runModuleDiscoveryAndValidation(
  deps: OrchestratorDeps,
): AsyncResult<ValidationResult> {
  const discoveryResult = await runFatalStage(deps, 'moduleDiscovery', deps.discover);
  if (discoveryResult.isErr()) {
    return err(discoveryResult.error);
  }
  deps.logger.info({
    msg: 'modules_discovered',
    count: discoveryResult.value.discovered.length,
  });

  const validationResult = await runFatalStage(deps, 'moduleValidation', deps.validate);
  if (validationResult.isErr()) {
    deps.logger.error({ msg: 'module_validation_failed' });
    return err(validationResult.error);
  }
  return ok(validationResult.value);
}

async function runFatalStage<T>(
  deps: OrchestratorDeps,
  stage: StartupStageName,
  action: () => AsyncResult<T>,
): AsyncResult<T> {
  deps.startupState.markStarted(stage);
  const result = await action();
  if (result.isErr()) {
    markFailedAndDeactivate(deps, stage, result.error.code);
    return err(result.error);
  }
  deps.startupState.markReady(stage);
  return ok(result.value);
}

function markFailedAndDeactivate(
  deps: OrchestratorDeps,
  stage: StartupStageName,
  errorCode: string,
): void {
  deps.startupState.markFailed(stage, errorCode);
  deps.startupState.deactivateReadiness();
}
