import { ok, err } from 'neverthrow';
import type { AsyncResult } from '@tempot/shared';
import { AppError } from '@tempot/shared';
import type { ModuleConfig } from '@tempot/module-registry';
import type { Bot, Context } from 'grammy';
import type {
  ModuleLogger,
  ModuleDependencyContainer,
  ModuleSetupFn,
} from '../bot-server.types.js';
import { BOT_SERVER_ERRORS } from '../bot-server.errors.js';

export type ModuleImporter = (path: string) => Promise<{ default?: ModuleSetupFn }>;

interface ModuleLoaderDeps {
  logger: ModuleLogger;
  eventBus: ModuleDependencyContainer['eventBus'];
  sessionProvider: ModuleDependencyContainer['sessionProvider'];
  i18n: ModuleDependencyContainer['i18n'];
  settings: ModuleDependencyContainer['settings'];
  importer: ModuleImporter;
}

interface ValidatedModuleInput {
  path: string;
  config: ModuleConfig;
}

export async function loadModuleHandlers(
  bot: Bot<Context>,
  modules: ValidatedModuleInput[],
  deps: ModuleLoaderDeps,
): AsyncResult<string[]> {
  const loadedNames: string[] = [];

  for (const mod of modules) {
    const result = await loadSingleModule(bot, mod, deps);
    if (result.isErr()) {
      return err(result.error);
    }
    if (result.value !== undefined) {
      loadedNames.push(result.value);
    }
  }

  return ok(loadedNames);
}

async function loadSingleModule(
  bot: Bot<Context>,
  mod: ValidatedModuleInput,
  deps: ModuleLoaderDeps,
): AsyncResult<string | undefined> {
  const childLogger = deps.logger.child({ module: mod.config.name });

  let imported: { default?: ModuleSetupFn };
  try {
    imported = await deps.importer(mod.path);
  } catch (error: unknown) {
    return handleImportError(mod, error, childLogger);
  }

  if (!imported.default) {
    return handleMissingExport(mod, childLogger);
  }

  return executeSetup({ bot, mod, setupFn: imported.default, deps, childLogger });
}

function handleMissingExport(
  mod: ValidatedModuleInput,
  logger: ModuleLogger,
): AsyncResult<string | undefined> {
  if (mod.config.isCore) {
    logger.error({ msg: 'Core module missing default export', module: mod.config.name });
    return Promise.resolve(
      err(
        new AppError(BOT_SERVER_ERRORS.MODULE_SETUP_MISSING, {
          module: mod.config.name,
        }),
      ),
    );
  }
  logger.warn({ msg: 'Module missing default export, skipping', module: mod.config.name });
  return Promise.resolve(ok(undefined));
}

function extractErrorDetails(error: unknown): Record<string, unknown> {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      code: (error as NodeJS.ErrnoException).code,
      stack: error.stack?.split('\n').slice(0, 3).join(' → '),
    };
  }
  return { error: String(error) };
}

function handleImportError(
  mod: ValidatedModuleInput,
  error: unknown,
  logger: ModuleLogger,
): AsyncResult<string | undefined> {
  const details = extractErrorDetails(error);

  if (mod.config.isCore) {
    logger.error({ msg: 'Core module import failed', module: mod.config.name, ...details });
    return Promise.resolve(
      err(
        new AppError(BOT_SERVER_ERRORS.CORE_MODULE_HANDLER_FAILED, {
          module: mod.config.name,
          ...details,
        }),
      ),
    );
  }
  logger.warn({ msg: 'Non-core module import failed, skipping', module: mod.config.name, ...details });
  return Promise.resolve(ok(undefined));
}

interface ExecuteSetupParams {
  bot: Bot<Context>;
  mod: ValidatedModuleInput;
  setupFn: ModuleSetupFn;
  deps: ModuleLoaderDeps;
  childLogger: ModuleLogger;
}

async function executeSetup(params: ExecuteSetupParams): AsyncResult<string | undefined> {
  const { bot, mod, setupFn, deps, childLogger } = params;
  const container: ModuleDependencyContainer = {
    logger: childLogger,
    eventBus: deps.eventBus,
    sessionProvider: deps.sessionProvider,
    i18n: deps.i18n,
    settings: deps.settings,
    config: mod.config,
  };

  try {
    await setupFn(bot, container);
    childLogger.info({ msg: 'Module loaded', module: mod.config.name });
    return ok(mod.config.name);
  } catch (error: unknown) {
    return handleSetupError(mod, error, childLogger);
  }
}

function handleSetupError(
  mod: ValidatedModuleInput,
  error: unknown,
  logger: ModuleLogger,
): AsyncResult<string | undefined> {
  const details = extractErrorDetails(error);

  if (mod.config.isCore) {
    logger.error({ msg: 'Core module setup failed', module: mod.config.name, ...details });
    return Promise.resolve(
      err(
        new AppError(BOT_SERVER_ERRORS.CORE_MODULE_HANDLER_FAILED, {
          module: mod.config.name,
          ...details,
        }),
      ),
    );
  }
  logger.warn({ msg: 'Non-core module setup failed, skipping', module: mod.config.name, ...details });
  return Promise.resolve(ok(undefined));
}
