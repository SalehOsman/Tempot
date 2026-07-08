import { createBot } from '../bot/bot.factory.js';
import type { SessionProvider } from '@tempot/session-manager';
import type { EventBusOrchestrator } from '@tempot/event-bus';
import { BOT_ACCESS_MODES, type BotAccessMode, type SettingsService } from '@tempot/settings';
import type { SentryReporter } from '@tempot/sentry';
import type { ValidatedModule } from '@tempot/module-registry';
import type { OrchestratorDeps } from './orchestrator.js';
import { createMongoAbility } from '@casl/ability';
import { AbilityFactory } from '@tempot/auth-core';
import type { SessionUser } from '@tempot/auth-core';
import { InteractionRecorder } from '@tempot/interaction-observability';
import { createAuditLogWriter } from './audit-log.writer.js';
import { createInteractionEventWriter } from './interaction-event.writer.js';
import { AbilityRegistry } from '../authorization/ability-registry.js';

export interface BotFactoryDeps {
  log: typeof import('@tempot/logger').logger;
  eventBus: EventBusOrchestrator;
  sessionProvider: SessionProvider;
  settingsService: SettingsService;
  sentryReporter: SentryReporter | undefined;
  t: (key: string, options?: Record<string, unknown>) => string;
}

function buildCommandModuleMap(validatedModules: ValidatedModule[] = []): Record<string, string> {
  const commandModuleMap: Record<string, string> = {};
  for (const mod of validatedModules) {
    for (const command of mod.config.commands) {
      commandModuleMap[`/${command.command}`] = mod.config.name;
    }
  }
  return commandModuleMap;
}

type BotInstance = ReturnType<typeof createBot>;
type RuntimeBotDeps = Parameters<typeof createBot>[1];

function isBotAccessMode(value: unknown): value is BotAccessMode {
  return value === BOT_ACCESS_MODES.private || value === BOT_ACCESS_MODES.public;
}

function subscribeAbilityInvalidation(deps: BotFactoryDeps): void {
  deps.eventBus.subscribe('auth.user.permissions_invalidated', (payload) => {
    if (payload && typeof payload === 'object' && 'userId' in payload) {
      AbilityFactory.invalidate(payload.userId as string, payload.role as string | undefined);
      deps.log.info({
        msg: 'casl_ability_cache_invalidated',
        userId: payload.userId,
        role: payload.role,
      });
    }
  });
}

function escapeTelegramHtml(value: string): string {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

function subscribeCriticalAlerts(deps: BotFactoryDeps, bot: BotInstance): void {
  deps.eventBus.subscribe('system.alert.critical', (payload) => {
    if (!(payload && typeof payload === 'object' && 'message' in payload)) return;
    const staticResult = deps.settingsService.getStatic();
    const superAdminIds = staticResult.isOk() ? staticResult.value.superAdminIds : [];
    const alertMsg = deps.t('bot-server.critical_alert', {
      message: escapeTelegramHtml(String(payload.message)),
      error: escapeTelegramHtml(String((payload as { error?: string }).error ?? 'N/A')),
    });
    for (const adminId of superAdminIds) {
      bot.api.sendMessage(adminId, alertMsg, { parse_mode: 'HTML' }).catch((err) => {
        deps.log.error({
          msg: 'failed_to_send_critical_alert_to_admin',
          adminId,
          error: err instanceof Error ? err.message : String(err),
        });
      });
    }
  });
}

const systemAbilityDefinition = (user: SessionUser) =>
  createMongoAbility(user.role === 'SUPER_ADMIN' ? [{ action: 'manage', subject: 'all' }] : []);

export function buildBotFactory(
  deps: BotFactoryDeps,
  abilityRegistry = new AbilityRegistry(),
): OrchestratorDeps['createBot'] {
  abilityRegistry.register('bot-server', systemAbilityDefinition);
  subscribeAbilityInvalidation(deps);

  return (token: string, validatedModules?: ValidatedModule[]) => {
    const bot = createBot(token, createRuntimeBotDeps(deps, abilityRegistry, validatedModules));
    subscribeCriticalAlerts(deps, bot);
    return bot;
  };
}

function createRuntimeBotDeps(
  deps: BotFactoryDeps,
  abilityRegistry: AbilityRegistry,
  validatedModules?: ValidatedModule[],
): RuntimeBotDeps {
  return {
    logger: deps.log,
    redisClient: deps.eventBus.getRedisClient(),
    eventBus: {
      publish: async (event: string, payload: unknown) => {
        await deps.eventBus.publish(event, payload);
        return { isOk: () => true };
      },
    },
    t: (key: string, options?: Record<string, unknown>) => deps.t(key, options),
    getMaintenanceStatus: async () => {
      const result = await deps.settingsService.getMaintenanceStatus();
      return result.isOk() ? result.value : { enabled: false, isSuperAdmin: () => false };
    },
    getAccessMode: async () => {
      const dynamicResult = await deps.settingsService.getDynamic('bot_access_mode');
      if (dynamicResult.isOk() && isBotAccessMode(dynamicResult.value)) {
        return dynamicResult.value;
      }
      const result = deps.settingsService.getStatic();
      return result.isOk() ? result.value.botAccessMode : 'private';
    },
    getSessionUser: async (userId: number) => {
      const result = await deps.sessionProvider.getSession(String(userId), String(userId));
      if (result.isErr()) {
        if (result.error.code === 'session-manager.not_found') return null;
        throw result.error;
      }
      return {
        id: result.value.userId,
        role: result.value.role,
        status: result.value.status,
      };
    },
    abilityDefinitions: abilityRegistry.getRuntimeDefinitions(),
    commandScopeMap: new Map(),
    commandModuleMap: buildCommandModuleMap(validatedModules),
    auditLog: createAuditLogWriter(deps.log),
    interactionRecorder: new InteractionRecorder({
      sink: createInteractionEventWriter(deps.log),
      logger: deps.log,
    }),
    sentryReporter: deps.sentryReporter,
  };
}
