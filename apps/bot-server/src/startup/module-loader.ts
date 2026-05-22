import { ok, err } from 'neverthrow';
import type { AsyncResult } from '@tempot/shared';
import { AppError } from '@tempot/shared';
import type { ModuleConfig, ModuleNavigationItem, UserRole } from '@tempot/module-registry';
import type { Bot, Context } from 'grammy';
import type {
  ModuleLogger,
  ModuleDependencyContainer,
  ModuleSetupFn,
} from '../bot-server.types.js';
import { BOT_SERVER_ERRORS } from '../bot-server.errors.js';
import { createCallbackFallbackMiddleware } from '../bot/middleware/callback-fallback.middleware.js';

export type ModuleImporter = (path: string) => Promise<{ default?: ModuleSetupFn }>;

interface ModuleLoaderDeps {
  logger: ModuleLogger;
  eventBus: ModuleDependencyContainer['eventBus'];
  sessionProvider: ModuleDependencyContainer['sessionProvider'];
  i18n: ModuleDependencyContainer['i18n'];
  settings: ModuleDependencyContainer['settings'];
  auditLog: ModuleDependencyContainer['auditLog'];
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
  const navigation = createModuleNavigationProvider(modules.map((mod) => mod.config));

  for (const mod of modules) {
    const result = await loadSingleModule({ bot, mod, deps, navigation });
    if (result.isErr()) {
      return err(result.error);
    }
    if (result.value !== undefined) {
      loadedNames.push(result.value);
    }
  }

  bot.use(createCallbackFallbackMiddleware({ logger: deps.logger, t: deps.i18n.t }));
  return ok(loadedNames);
}

interface LoadSingleModuleParams {
  bot: Bot<Context>;
  mod: ValidatedModuleInput;
  deps: ModuleLoaderDeps;
  navigation: ModuleDependencyContainer['navigation'];
}

async function loadSingleModule(params: LoadSingleModuleParams): AsyncResult<string | undefined> {
  const { bot, mod, deps, navigation } = params;
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

  return executeSetup({ bot, mod, setupFn: imported.default, deps, navigation, childLogger });
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
  logger.warn({
    msg: 'Non-core module import failed, skipping',
    module: mod.config.name,
    ...details,
  });
  return Promise.resolve(ok(undefined));
}

interface ExecuteSetupParams {
  bot: Bot<Context>;
  mod: ValidatedModuleInput;
  setupFn: ModuleSetupFn;
  deps: ModuleLoaderDeps;
  navigation: ModuleDependencyContainer['navigation'];
  childLogger: ModuleLogger;
}

async function executeSetup(params: ExecuteSetupParams): AsyncResult<string | undefined> {
  const { bot, mod, setupFn, deps, navigation, childLogger } = params;
  const container: ModuleDependencyContainer = {
    logger: childLogger,
    eventBus: deps.eventBus,
    sessionProvider: deps.sessionProvider,
    i18n: deps.i18n,
    settings: deps.settings,
    auditLog: deps.auditLog,
    navigation,
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
  logger.warn({
    msg: 'Non-core module setup failed, skipping',
    module: mod.config.name,
    ...details,
  });
  return Promise.resolve(ok(undefined));
}

const ROLE_LEVELS: Record<UserRole, number> = {
  GUEST: 1,
  USER: 2,
  ADMIN: 3,
  SUPER_ADMIN: 4,
};

function createModuleNavigationProvider(
  configs: ModuleConfig[],
): ModuleDependencyContainer['navigation'] {
  const entries = configs.flatMap((config) => config.navigation?.mainMenu ?? []);
  return {
    getMainMenuItems: (role: UserRole) =>
      entries
        .filter((entry) => ROLE_LEVELS[role] >= ROLE_LEVELS[entry.requiredRole])
        .sort(compareNavigationItems),
  };
}

function compareNavigationItems(left: ModuleNavigationItem, right: ModuleNavigationItem): number {
  return left.row - right.row || left.order - right.order || left.id.localeCompare(right.id);
}
