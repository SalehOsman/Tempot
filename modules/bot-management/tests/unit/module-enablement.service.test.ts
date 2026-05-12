import { describe, expect, it } from 'vitest';
import { ok, type Result } from 'neverthrow';
import { AppError } from '@tempot/shared';
import {
  ModuleEnablementService,
  type ModuleRegistryMetadataPort,
  type ModuleEnablementRepositoryPort,
} from '../../services/module-enablement.service.js';
import {
  BotModuleEnablementState,
  type BotModuleEnablement,
} from '../../types/module-enablement.types.js';
import { BOT_MANAGEMENT_EVENTS } from '../../events/event-names.js';

function repository(): ModuleEnablementRepositoryPort {
  const records: BotModuleEnablement[] = [];
  return {
    listByBotId: async () => ok(records),
    setState: async (input) => {
      const record: BotModuleEnablement = {
        id: `module-${records.length + 1}`,
        botId: input.botId,
        moduleName: input.moduleName,
        state: input.state,
        blockedReason: input.blockedReason ?? null,
        enabledBy: input.enabledBy ?? null,
        enabledAt: input.state === BotModuleEnablementState.ENABLED ? new Date() : null,
        updatedAt: new Date(),
      };
      records.push(record);
      return ok(record);
    },
  };
}

function eventBus() {
  const events: { event: string; payload: Record<string, unknown> }[] = [];
  return {
    events,
    publish: async (
      event: string,
      payload: Record<string, unknown>,
    ): Promise<Result<void, AppError>> => {
      events.push({ event, payload });
      return ok(undefined);
    },
  };
}

function registry(
  packages: string[] = ['notifier'],
  availablePackages: string[] = packages,
): ModuleRegistryMetadataPort {
  return {
    getModule: (name) =>
      name === 'template-management'
        ? {
            name,
            config: {
              isActive: true,
              requires: {
                packages,
              },
            },
          }
        : undefined,
    isPackageAvailable: (name) => availablePackages.includes(name),
  };
}

describe('ModuleEnablementService', () => {
  it('enables an implemented module and publishes an event', async () => {
    const bus = eventBus();
    const service = new ModuleEnablementService(repository(), bus, registry());

    const result = await service.enable('bot-1', 'template-management', 'admin-1');

    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap().state).toBe(BotModuleEnablementState.ENABLED);
    expect(bus.events[0]?.event).toBe(BOT_MANAGEMENT_EVENTS.MODULE_ENABLEMENT_CHANGED);
  });

  it('requires a blocked reason before storing blocked state', async () => {
    const service = new ModuleEnablementService(repository(), eventBus(), registry());

    const result = await service.setState({
      botId: 'bot-1',
      moduleName: 'unknown-module',
      state: BotModuleEnablementState.BLOCKED,
      actorId: 'admin-1',
    });

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr().code).toBe('bot-management.blocked_reason_required');
  });

  it('records unavailable state when a module is not registered', async () => {
    const service = new ModuleEnablementService(repository(), eventBus(), registry());

    const result = await service.enable('bot-1', 'unknown-module', 'admin-1');

    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap().state).toBe(BotModuleEnablementState.UNAVAILABLE);
    expect(result._unsafeUnwrap().blockedReason).toBe('bot-management.module_unavailable');
  });

  it('records blocked state when module requirements are missing', async () => {
    const service = new ModuleEnablementService(
      repository(),
      eventBus(),
      registry(['missing-package'], []),
    );

    const result = await service.enable('bot-1', 'template-management', 'admin-1');

    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap().state).toBe(BotModuleEnablementState.BLOCKED);
    expect(result._unsafeUnwrap().blockedReason).toBe('bot-management.module_requirements_missing');
  });
});
