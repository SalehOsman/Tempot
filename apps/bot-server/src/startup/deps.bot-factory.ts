import { createBot } from '../bot/bot.factory.js';
import type { SessionProvider } from '@tempot/session-manager';
import type { EventBusOrchestrator } from '@tempot/event-bus';
import type { SettingsService } from '@tempot/settings';
import type { SentryReporter } from '@tempot/sentry';
import type { ValidatedModule } from '@tempot/module-registry';
import type { OrchestratorDeps } from './orchestrator.js';
import { createMongoAbility } from '@casl/ability';
import { AbilityFactory } from '@tempot/auth-core';
import { InteractionRecorder } from '@tempot/interaction-observability';
import { createAuditLogWriter } from './audit-log.writer.js';
import { createInteractionEventWriter } from './interaction-event.writer.js';

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

function subscribeCriticalAlerts(deps: BotFactoryDeps, bot: BotInstance): void {
  deps.eventBus.subscribe('system.alert.critical', (payload) => {
    if (!(payload && typeof payload === 'object' && 'message' in payload)) return;
    const staticResult = deps.settingsService.getStatic();
    const superAdminIds = staticResult.isOk() ? staticResult.value.superAdminIds : [];
    const alertMsg =
      `⚠️ <b>[System Degradation Alert]</b>\n\n` +
      `<b>Message:</b> ${payload.message}\n` +
      `<b>Error:</b> ${(payload as { error?: string }).error ?? 'N/A'}`;
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

export function buildBotFactory(deps: BotFactoryDeps): OrchestratorDeps['createBot'] {
  subscribeAbilityInvalidation(deps);

  return (token: string, validatedModules?: ValidatedModule[]) => {
    const bot = createBot(token, createRuntimeBotDeps(deps, validatedModules));
    subscribeCriticalAlerts(deps, bot);
    return bot;
  };
}

function createRuntimeBotDeps(
  deps: BotFactoryDeps,
  validatedModules?: ValidatedModule[],
): RuntimeBotDeps {
  return {
    logger: deps.log,
    redisClient: deps.eventBus.getRedisClient(),
    eventBus: {
      publish: async (event: string, payload: unknown) => {
        await deps.eventBus.publish(event as never, payload as never);
        return { isOk: () => true };
      },
    },
    t: (key: string, options?: Record<string, unknown>) => deps.t(key, options),
    getMaintenanceStatus: async () => {
      const result = await deps.settingsService.getMaintenanceStatus();
      return result.isOk() ? result.value : { enabled: false, isSuperAdmin: () => false };
    },
    getSessionUser: async (userId: number) => {
      const result = await deps.sessionProvider.getSession(String(userId), String(userId));
      if (result.isErr()) return null;
      return { id: String(userId), role: result.value.role };
    },
    abilityDefinitions: [
      (user: { id: string | number; role: string }) =>
        createMongoAbility(
          user.role === 'SUPER_ADMIN' ? [{ action: 'manage', subject: 'all' }] : [],
        ),
    ],
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
