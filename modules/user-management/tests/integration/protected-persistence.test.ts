import { describe, expect, it, vi } from 'vitest';
import { ok } from 'neverthrow';
import { NodeProtectedDataService, type ProtectedDataKeyProvider } from '@tempot/database';
import { formatNationalId } from '@tempot/national-id-parser';
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
      getReadableLookupKeyVersions: () => ok(['lookup-v1']),
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

  it('finds and recovers a user through the national ID lookup token', async () => {
    const nationalId = '29801011234567';
    const recordId = 'national-lookup-user';
    const encryptionKey = Buffer.alloc(32, 3);
    const lookupKey = Buffer.alloc(32, 4);
    const keyProvider: ProtectedDataKeyProvider = {
      getActiveEncryptionKey: () => ok({ version: 'enc-v1', key: encryptionKey }),
      getEncryptionKey: () => ok({ version: 'enc-v1', key: encryptionKey }),
      getActiveLookupKey: () => ok({ version: 'lookup-v1', key: lookupKey }),
      getLookupKey: () => ok({ version: 'lookup-v1', key: lookupKey }),
      getReadableLookupKeyVersions: () => ok(['lookup-v1']),
      validate: () => ok(undefined),
    };
    const protectionService = new NodeProtectedDataService(keyProvider);
    const payload = protectionService
      .protect(nationalId, { fieldId: 'nationalId', recordId })
      ._unsafeUnwrap();
    const lookup = protectionService
      .createLookupToken(formatNationalId(nationalId), 'nationalId')
      ._unsafeUnwrap();
    const findMany = vi.fn().mockResolvedValue([
      {
        id: recordId,
        telegramId: 456n,
        nationalId: null,
        nationalIdProtected: payload,
        nationalIdLookupToken: lookup.token,
        isDeleted: false,
      },
    ]);
    const database = {
      userProfile: {
        create: vi.fn(),
        findUnique: vi.fn(),
        findMany,
        update: vi.fn(),
        delete: vi.fn(),
      },
    };
    const repository = new UserRepository(
      { log: vi.fn().mockResolvedValue(undefined) },
      database as never,
      protectionService,
    );

    const result = await repository.findByNationalId(nationalId);

    expect(result.isOk()).toBe(true);
    if (result.isErr()) return;
    expect(result.value.nationalId).toBe(nationalId);
    expect(findMany).toHaveBeenCalledWith({
      where: {
        isDeleted: false,
        nationalIdLookupToken: { in: [lookup.token] },
      },
    });
  });
});
