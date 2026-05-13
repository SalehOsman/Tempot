import { createBot } from '../bot/bot.factory.js';
import type { SessionProvider } from '@tempot/session-manager';
import type { EventBusOrchestrator } from '@tempot/event-bus';
import type { SettingsService } from '@tempot/settings';
import type { SentryReporter } from '@tempot/sentry';
import type { ValidatedModule } from '@tempot/module-registry';
import type { OrchestratorDeps } from './orchestrator.js';
import { createMongoAbility } from '@casl/ability';

export interface BotFactoryDeps {
  log: typeof import('@tempot/logger').logger;
  eventBus: EventBusOrchestrator;
  sessionProvider: SessionProvider;
  settingsService: SettingsService;
  sentryReporter: SentryReporter | undefined;
  t: (key: string) => string;
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

export function buildBotFactory(deps: BotFactoryDeps): OrchestratorDeps['createBot'] {
  return (token: string, validatedModules?: ValidatedModule[]) =>
    createBot(token, {
      logger: deps.log,
      eventBus: {
        publish: async (event: string, payload: unknown) => {
          await deps.eventBus.publish(event as never, payload as never);
          return { isOk: () => true };
        },
      },
      t: (key: string) => deps.t(key),
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
      auditLog: async () => {},
      sentryReporter: deps.sentryReporter,
    });
}
