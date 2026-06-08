import { describe, expect, it, vi } from 'vitest';
import { UserRepository } from '../../repositories/user.repository.js';

describe('UserRepository protected persistence', () => {
  it('does not pass protected canary plaintext to the persistence delegate', async () => {
    const canary = 'tempot-canary-email@example.com';
    const create = vi.fn().mockResolvedValue({
      id: 'user-1',
      telegramId: 123n,
      email: canary,
    });
    const database = {
      userProfile: {
        create,
        findUnique: vi.fn(),
        findMany: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
    };
    const auditLogger = { log: vi.fn().mockResolvedValue(undefined) };
    const repository = new UserRepository(auditLogger, database as never);

    const result = await repository.create({
      telegramId: 123n,
      email: canary,
    });

    expect(result.isOk()).toBe(true);
    const serialize = (value: unknown) =>
      JSON.stringify(value, (_key, nestedValue: unknown) =>
        typeof nestedValue === 'bigint' ? nestedValue.toString() : nestedValue,
      );
    expect(serialize(create.mock.calls)).not.toContain(canary);
    expect(serialize(auditLogger.log.mock.calls)).not.toContain(canary);
  });
});
