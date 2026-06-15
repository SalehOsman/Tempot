import { describe, expect, it, vi } from 'vitest';
import type { IAuditLogger } from '@tempot/database';
import { BotRepository } from '../../repositories/bot.repository.js';
import { BotHealthStatus, BotRuntimeMode, type ManagedBot } from '../../types/bot.types.js';

const auditLogger: IAuditLogger = { log: vi.fn().mockResolvedValue(undefined) };

function bot(id: string): ManagedBot {
  return {
    id,
    displayName: `Bot ${id}`,
    telegramUsername: `bot_${id}`,
    tokenFingerprint: `fingerprint-${id}`,
    tokenRedacted: 'redacted',
    ownerId: 'owner-1',
    runtimeMode: BotRuntimeMode.POLLING,
    status: 'ACTIVE',
    defaultLocale: 'en',
    defaultCountry: 'US',
    timezone: 'UTC',
    healthStatus: BotHealthStatus.HEALTHY,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    isDeleted: false,
    deletedAt: null,
    deletedBy: null,
  };
}

describe('BotRepository aggregate pagination', () => {
  it('uses aggregate count for list totals', async () => {
    const findMany = vi.fn().mockResolvedValue([bot('1')]);
    const count = vi.fn().mockResolvedValue(17);
    const repository = new BotRepository(auditLogger, {
      managedBot: { findMany, count },
    } as unknown as ConstructorParameters<typeof BotRepository>[1]);

    const result = await repository.list(1, 5);

    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap().totalCount).toBe(17);
    expect(findMany).toHaveBeenCalledTimes(1);
    expect(count).toHaveBeenCalledWith({ where: { isDeleted: false } });
  });
});
