import { describe, expect, it } from 'vitest';
import { ok, err, type Result } from 'neverthrow';
import { AppError } from '@tempot/shared';
import { BotService, type BotRepositoryPort } from '../../services/bot.service.js';
import { BotRuntimeMode } from '../../types/bot.types.js';
import { BotHealthStatus } from '../../types/bot.types.js';
import { BotLifecycleStatus } from '../../types/lifecycle.types.js';
import { BOT_MANAGEMENT_EVENTS } from '../../events/event-names.js';
import type { ManagedBot } from '../../types/bot.types.js';

const now = new Date('2026-05-12T00:00:00.000Z');

function bot(overrides: Partial<ManagedBot> = {}): ManagedBot {
  return {
    id: 'bot-1',
    displayName: 'Support Bot',
    telegramUsername: 'support_bot',
    tokenFingerprint: 'fingerprint',
    tokenRedacted: '123456:...abcd',
    ownerId: 'admin-1',
    runtimeMode: BotRuntimeMode.POLLING,
    status: BotLifecycleStatus.DRAFT,
    defaultLocale: 'ar-EG',
    defaultCountry: 'EG',
    timezone: 'Africa/Cairo',
    healthStatus: BotHealthStatus.UNKNOWN,
    createdAt: now,
    updatedAt: now,
    isDeleted: false,
    deletedAt: null,
    deletedBy: null,
    ...overrides,
  };
}

function repo(existing: ManagedBot[] = []): BotRepositoryPort {
  const records = [...existing];
  return {
    create: async (data) => {
      const created = bot({ ...data, id: `bot-${records.length + 1}` });
      records.push(created);
      return ok(created);
    },
    findById: async (id) => {
      const found = records.find((item) => item.id === id && !item.isDeleted);
      return found ? ok(found) : err(new AppError('bot-management.not_found'));
    },
    findByTelegramUsername: async (username) => {
      const found = records.find((item) => item.telegramUsername === username && !item.isDeleted);
      return found ? ok(found) : err(new AppError('bot-management.not_found'));
    },
    list: async () =>
      ok({ bots: records.filter((item) => !item.isDeleted), totalCount: records.length }),
    update: async (id, data) => {
      const index = records.findIndex((item) => item.id === id);
      if (index < 0) return err(new AppError('bot-management.not_found'));
      const updated = { ...records[index], ...data, updatedAt: now };
      records[index] = updated;
      return ok(updated);
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

describe('BotService', () => {
  it('registers a draft bot with a redacted credential and domain event', async () => {
    const bus = eventBus();
    const service = new BotService(repo(), bus);

    const result = await service.register(
      {
        displayName: 'Support Bot',
        telegramUsername: 'support_bot',
        token: '123456:abcdefghijklmnopqrstuvwxyz',
        ownerId: 'admin-1',
        runtimeMode: BotRuntimeMode.POLLING,
        defaultLocale: 'ar-EG',
        defaultCountry: 'EG',
        timezone: 'Africa/Cairo',
      },
      'admin-1',
    );

    expect(result.isOk()).toBe(true);
    const created = result._unsafeUnwrap();
    expect(created.status).toBe(BotLifecycleStatus.DRAFT);
    expect(created.tokenRedacted).toBe('123456:...wxyz');
    expect(created.tokenFingerprint).not.toContain('abcdefghijklmnopqrstuvwxyz');
    expect(bus.events[0]?.event).toBe(BOT_MANAGEMENT_EVENTS.BOT_REGISTERED);
  });

  it('rejects duplicate Telegram usernames without creating a bot', async () => {
    const service = new BotService(repo([bot({ telegramUsername: 'support_bot' })]), eventBus());

    const result = await service.register(
      {
        displayName: 'Other Bot',
        telegramUsername: 'support_bot',
        token: '111111:abcdefghijklmnopqrstuvwxyz',
        ownerId: 'admin-1',
        runtimeMode: BotRuntimeMode.POLLING,
        defaultLocale: 'ar-EG',
        defaultCountry: 'EG',
        timezone: 'Africa/Cairo',
      },
      'admin-1',
    );

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr().code).toBe('bot-management.duplicate_username');
  });

  it('archives a bot through soft-delete metadata', async () => {
    const service = new BotService(repo([bot()]), eventBus());

    const result = await service.archive('bot-1', 'admin-1', 'No longer needed');

    expect(result.isOk()).toBe(true);
    const archived = result._unsafeUnwrap();
    expect(archived.status).toBe(BotLifecycleStatus.ARCHIVED);
    expect(archived.deletedBy).toBe('admin-1');
    expect(archived.deletedAt).toBeInstanceOf(Date);
  });
});
