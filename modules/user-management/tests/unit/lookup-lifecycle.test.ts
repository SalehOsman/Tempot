import { describe, expect, it, vi } from 'vitest';
import { ok } from 'neverthrow';
import { NodeProtectedDataService, type ProtectedDataKeyProvider } from '@tempot/database';
import { formatNationalId } from '@tempot/national-id-parser';
import { UserProtectionMapper } from '../../repositories/user-protection.mapper.js';
import { UserRepository } from '../../repositories/user.repository.js';

const encryptionKey = Buffer.alloc(32, 41);
const oldLookupKey = Buffer.alloc(32, 42);
const newLookupKey = Buffer.alloc(32, 43);

function createProtectionService(activeLookupVersion: 'lookup-v1' | 'lookup-v2') {
  const lookupKeys = {
    'lookup-v1': oldLookupKey,
    'lookup-v2': newLookupKey,
  };
  const keyProvider: ProtectedDataKeyProvider = {
    getActiveEncryptionKey: () => ok({ version: 'enc-v1', key: encryptionKey }),
    getEncryptionKey: () => ok({ version: 'enc-v1', key: encryptionKey }),
    getActiveLookupKey: () =>
      ok({ version: activeLookupVersion, key: lookupKeys[activeLookupVersion] }),
    getLookupKey: (version) =>
      ok({
        version,
        key: lookupKeys[version as keyof typeof lookupKeys],
      }),
    getReadableLookupKeyVersions: () =>
      ok(activeLookupVersion === 'lookup-v2' ? ['lookup-v2', 'lookup-v1'] : ['lookup-v1']),
    validate: () => ok(undefined),
  };
  return new NodeProtectedDataService(keyProvider);
}

describe('protected lookup lifecycle', () => {
  it('should clear lookup metadata when a protected lookup field is cleared', () => {
    const mapper = new UserProtectionMapper(createProtectionService('lookup-v2'));

    const result = mapper.protectInput(
      {
        email: null,
        nationalId: null,
      },
      'clear-lookup-user',
    );

    expect(result.isOk()).toBe(true);
    if (result.isErr()) return;
    expect(result.value).toMatchObject({
      emailProtected: null,
      emailLookupToken: null,
      emailLookupKeyVersion: null,
      emailNormalizationVersion: null,
      nationalIdProtected: null,
      nationalIdLookupToken: null,
      nationalIdLookupKeyVersion: null,
      nationalIdNormalizationVersion: null,
    });
  });

  it('should find a protected identity while its lookup token uses the previous key', async () => {
    const nationalId = '29801011234567';
    const recordId = 'lookup-transition-user';
    const oldService = createProtectionService('lookup-v1');
    const rotatingService = createProtectionService('lookup-v2');
    const payload = oldService
      .protect(nationalId, { fieldId: 'nationalId', recordId })
      ._unsafeUnwrap();
    const oldLookup = oldService
      .createLookupToken(formatNationalId(nationalId), 'nationalId')
      ._unsafeUnwrap();
    const row = {
      id: recordId,
      telegramId: 501n,
      nationalId: null,
      nationalIdProtected: payload,
      nationalIdLookupToken: oldLookup.token,
      nationalIdLookupKeyVersion: oldLookup.tokenKeyVersion,
      isDeleted: false,
    };
    const findMany = vi.fn().mockImplementation((args: { where: Record<string, unknown> }) => {
      const serialized = JSON.stringify(args);
      expect(serialized).not.toContain('"not"');
      expect(serialized).not.toContain('nationalIdLookupKeyVersion');
      const tokenFilter = args.where['nationalIdLookupToken'];
      const tokens =
        typeof tokenFilter === 'object' && tokenFilter !== null
          ? (tokenFilter as Record<string, unknown>)['in']
          : undefined;
      const exactMatch = Array.isArray(tokens) && tokens.includes(oldLookup.token);
      return Promise.resolve(exactMatch ? [row] : []);
    });
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
      rotatingService,
    );

    const result = await repository.findByNationalId(formatNationalId(nationalId));

    expect(result.isOk()).toBe(true);
    if (result.isErr()) return;
    expect(result.value.id).toBe(recordId);
  });
});
