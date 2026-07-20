import { describe, expect, it, vi } from 'vitest';
import { BootstrapSessionRepository } from '../../src/repositories/bootstrap-session.repository.js';

describe('BootstrapSessionRepository', () => {
  it('upserts super-admin bootstrap sessions through a typed repository contract', async () => {
    const upsert = vi.fn().mockResolvedValue({});
    const repository = new BootstrapSessionRepository({
      session: { upsert },
      userProfile: { upsert: vi.fn().mockResolvedValue({}) },
    });

    const result = await repository.upsertSuperAdminSession({
      sessionId: '123:123',
      userId: '123',
      chatId: '123',
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
      language: 'ar-EG',
    });

    expect(result.isOk()).toBe(true);
    expect(upsert).toHaveBeenCalledWith({
      where: { id: '123:123' },
      update: { role: 'SUPER_ADMIN' },
      create: {
        id: '123:123',
        userId: '123',
        chatId: '123',
        role: 'SUPER_ADMIN',
        status: 'ACTIVE',
        language: 'ar-EG',
      },
    });
  });

  it('upserts a matching super-admin profile for start command lookup', async () => {
    const sessionUpsert = vi.fn().mockResolvedValue({});
    const profileUpsert = vi.fn().mockResolvedValue({});
    const repository = new BootstrapSessionRepository({
      session: { upsert: sessionUpsert },
      userProfile: { upsert: profileUpsert },
    });

    const result = await repository.upsertSuperAdminSession({
      sessionId: '123:123',
      userId: '123',
      chatId: '123',
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
      language: 'ar-EG',
    });

    expect(result.isOk()).toBe(true);
    expect(profileUpsert).toHaveBeenCalledWith({
      where: { telegramId: BigInt(123) },
      update: { role: 'SUPER_ADMIN', language: 'ar-EG' },
      create: {
        telegramId: BigInt(123),
        username: null,
        language: 'ar-EG',
        role: 'SUPER_ADMIN',
      },
    });
  });

  it('returns a typed non-sensitive error when session upsert fails', async () => {
    const upsert = vi.fn().mockRejectedValue(new Error('connection lost'));
    const repository = new BootstrapSessionRepository({
      session: { upsert },
      userProfile: { upsert: vi.fn().mockResolvedValue({}) },
    });

    const result = await repository.upsertSuperAdminSession({
      sessionId: '123:123',
      userId: '123',
      chatId: '123',
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
      language: 'ar-EG',
    });

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr().code).toBe('database.bootstrap_session_upsert_failed');
  });
});
