import { describe, expect, it, vi } from 'vitest';
import { ok } from 'neverthrow';
import { NodeProtectedDataService, type ProtectedDataKeyProvider } from '@tempot/database';
import { UserRepository } from '../../repositories/user.repository.js';

describe('UserRepository protected persistence', () => {
  it('does not pass protected canary plaintext to the persistence delegate', async () => {
    const canary = 'tempot-canary-email@example.com';
    const create = vi
      .fn()
      .mockImplementation((args: { data: Record<string, unknown> }) =>
        Promise.resolve({ ...args.data }),
      );
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
    const encryptionKey = Buffer.alloc(32, 1);
    const lookupKey = Buffer.alloc(32, 2);
    const keyProvider: ProtectedDataKeyProvider = {
      getActiveEncryptionKey: () => ok({ version: 'enc-v1', key: encryptionKey }),
      getEncryptionKey: () => ok({ version: 'enc-v1', key: encryptionKey }),
      getActiveLookupKey: () => ok({ version: 'lookup-v1', key: lookupKey }),
      getLookupKey: () => ok({ version: 'lookup-v1', key: lookupKey }),
      validate: () => ok(undefined),
    };
    const repository = new UserRepository(
      auditLogger,
      database as never,
      new NodeProtectedDataService(keyProvider),
    );

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
