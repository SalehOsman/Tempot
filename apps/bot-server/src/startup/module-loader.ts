import { err, ok } from 'neverthrow';
import type { AsyncResult } from '@tempot/shared';
import type { AbilityDefinition } from '@tempot/auth-core';
import type { ModuleConfig } from '@tempot/module-registry';
import type { Bot, Context } from 'grammy';
import type {
  AuthorizationContextResolver,
  ModuleDependencyContainer,
  ModuleLogger,
  ModuleSetupFn,
} from '../bot-server.types.js';
import { createCallbackFallbackMiddleware } from '../bot/middleware/callback-fallback.middleware.js';
import { createModuleAuthorizationProvider } from '../authorization/context-authorization.js';
import { createModuleNavigationProvider } from './module-navigation.provider.js';
import {
  handleImportError,
  handleMissingExport,
  handleSetupError,
} from './module-loader-errors.js';

export type ModuleImporter = (
  path: string,
) => Promise<{ default?: ModuleSetupFn; abilityDefinition?: AbilityDefinition }>;

interface ModuleLoaderDeps {
  logger: ModuleLogger;
  eventBus: ModuleDependencyContainer['eventBus'];
  sessionProvider: ModuleDependencyContainer['sessionProvider'];
  i18n: ModuleDependencyContainer['i18n'];
  settings: ModuleDependencyContainer['settings'];
  protectedData: ModuleDependencyContainer['protectedData'];
  auditLog: ModuleDependencyContainer['auditLog'];
  interactionEvents: ModuleDependencyContainer['interactionEvents'];
  backups?: ModuleDependencyContainer['backups'];
  aiAssistant?: ModuleDependencyContainer['aiAssistant'];
  knowledge?: ModuleDependencyContainer['knowledge'];
  resolveAuthorizationContext: AuthorizationContextResolver;
  abilityRegistry: { register: (moduleName: string, definition: AbilityDefinition) => void };
  importer: ModuleImporter;
}

export interface ValidatedModuleInput {
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
    if (result.isErr()) return err(result.error);
    if (result.value !== undefined) loadedNames.push(result.value);
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
  let imported: { default?: ModuleSetupFn; abilityDefinition?: AbilityDefinition };

  try {
    imported = await deps.importer(mod.path);
  } catch (error: unknown) {
    return handleImportError(mod, error, childLogger);
  }

  if (!imported.default) return handleMissingExport(mod, childLogger);
  if (imported.abilityDefinition) {
    deps.abilityRegistry.register(mod.config.name, imported.abilityDefinition);
  }
  return executeSetup({ bot, mod, setupFn: imported.default, deps, navigation, childLogger });
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
  const container = buildModuleContainer({ deps, navigation, childLogger, mod });

  try {
    await setupFn(bot, container);
    childLogger.info({ msg: 'Module loaded', module: mod.config.name });
    return ok(mod.config.name);
  } catch (error: unknown) {
    return handleSetupError(mod, error, childLogger);
  }
}

interface BuildModuleContainerParams {
  deps: ModuleLoaderDeps;
  navigation: ModuleDependencyContainer['navigation'];
  childLogger: ModuleLogger;
  mod: ValidatedModuleInput;
}

function buildModuleContainer(params: BuildModuleContainerParams): ModuleDependencyContainer {
  const { deps, navigation, childLogger, mod } = params;
  return {
    logger: childLogger,
    eventBus: deps.eventBus,
    sessionProvider: deps.sessionProvider,
    i18n: deps.i18n,
    settings: deps.settings,
    protectedData: deps.protectedData,
    auditLog: deps.auditLog,
    interactionEvents: deps.interactionEvents,
    backups: deps.backups,
    aiAssistant: deps.aiAssistant,
    knowledge: deps.knowledge,
    navigation,
    authorization: createModuleAuthorizationProvider({
      logger: childLogger,
      t: deps.i18n.t,
      resolveContext: deps.resolveAuthorizationContext,
    }),
    config: mod.config,
  };
}
