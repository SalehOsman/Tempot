import { describe, expect, it } from 'vitest';
import { ok, type Result } from 'neverthrow';
import { AppError } from '@tempot/shared';
import {
  LifecycleService,
  type LifecycleBotRepositoryPort,
} from '../../services/lifecycle.service.js';
import { BotRuntimeMode, BotHealthStatus, type ManagedBot } from '../../types/bot.types.js';
import { BotLifecycleStatus, type BotLifecycleEvent } from '../../types/lifecycle.types.js';
import { BOT_MANAGEMENT_EVENTS } from '../../events/event-names.js';

const now = new Date('2026-05-12T00:00:00.000Z');

function bot(status: BotLifecycleStatus): ManagedBot {
  return {
    id: 'bot-1',
    displayName: 'Support Bot',
    telegramUsername: 'support_bot',
    tokenFingerprint: 'fingerprint',
    tokenRedacted: '123456:...abcd',
    ownerId: 'admin-1',
    runtimeMode: BotRuntimeMode.POLLING,
    status,
    defaultLocale: 'ar-EG',
    defaultCountry: 'EG',
    timezone: 'Africa/Cairo',
    healthStatus: BotHealthStatus.UNKNOWN,
    createdAt: now,
    updatedAt: now,
    isDeleted: false,
    deletedAt: null,
    deletedBy: null,
  };
}

function repository(initial: ManagedBot): LifecycleBotRepositoryPort {
  let record = initial;
  return {
    findById: async () => ok(record),
    update: async (_id, data) => {
      record = { ...record, ...data, updatedAt: now };
      return ok(record);
    },
  };
}

function lifecycleEvents() {
  const records: BotLifecycleEvent[] = [];
  return {
    records,
    append: async (event: Omit<BotLifecycleEvent, 'id' | 'createdAt'>) => {
      const record = { ...event, id: `event-${records.length + 1}`, createdAt: now };
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

describe('LifecycleService', () => {
  it('transitions a bot through a valid lifecycle change with history and event', async () => {
    const history = lifecycleEvents();
    const bus = eventBus();
    const service = new LifecycleService(repository(bot(BotLifecycleStatus.DRAFT)), history, bus);

    const result = await service.transition({
      botId: 'bot-1',
      toStatus: BotLifecycleStatus.CONFIGURED,
      actorId: 'admin-1',
    });

    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap().status).toBe(BotLifecycleStatus.CONFIGURED);
    expect(history.records).toHaveLength(1);
    expect(bus.events[0]?.event).toBe(BOT_MANAGEMENT_EVENTS.LIFECYCLE_CHANGED);
  });

  it('rejects invalid lifecycle transitions without changing the bot', async () => {
    const service = new LifecycleService(
      repository(bot(BotLifecycleStatus.DRAFT)),
      lifecycleEvents(),
      eventBus(),
    );

    const result = await service.transition({
      botId: 'bot-1',
      toStatus: BotLifecycleStatus.ACTIVE,
      actorId: 'admin-1',
    });

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr().code).toBe('bot-management.invalid_transition');
  });

  it('requires a reason when pausing an active bot', async () => {
    const service = new LifecycleService(
      repository(bot(BotLifecycleStatus.ACTIVE)),
      lifecycleEvents(),
      eventBus(),
    );

    const result = await service.transition({
      botId: 'bot-1',
      toStatus: BotLifecycleStatus.PAUSED,
      actorId: 'admin-1',
    });

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr().code).toBe('bot-management.missing_reason');
  });
});
