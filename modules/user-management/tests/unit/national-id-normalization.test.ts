import { describe, expect, it } from 'vitest';
import { ok } from 'neverthrow';
import { NodeProtectedDataService, type ProtectedDataKeyProvider } from '@tempot/database';
import { UserProtectionMapper } from '../../repositories/user-protection.mapper.js';

const encryptionKey = Buffer.alloc(32, 51);
const lookupKey = Buffer.alloc(32, 52);

function createMapper(): UserProtectionMapper {
  const keyProvider: ProtectedDataKeyProvider = {
    getActiveEncryptionKey: () => ok({ version: 'enc-v1', key: encryptionKey }),
    getEncryptionKey: () => ok({ version: 'enc-v1', key: encryptionKey }),
    getActiveLookupKey: () => ok({ version: 'lookup-v1', key: lookupKey }),
    getLookupKey: () => ok({ version: 'lookup-v1', key: lookupKey }),
    getReadableLookupKeyVersions: () => ok(['lookup-v1']),
    validate: () => ok(undefined),
  };
  return new UserProtectionMapper(new NodeProtectedDataService(keyProvider));
}

describe('national ID lookup normalization', () => {
  it('should use one token for equivalent write and lookup formats', () => {
    const mapper = createMapper();

    const compact = mapper.protectInput(
      { nationalId: '28009010100332' },
      'compact-national-id-user',
    );
    const hyphenated = mapper.protectInput(
      { nationalId: '2800901-0100332' },
      'hyphenated-national-id-user',
    );
    const lookup = mapper.createLookupConditions('2800901 0100332', 'nationalId');

    expect(compact.isOk()).toBe(true);
    expect(hyphenated.isOk()).toBe(true);
    expect(lookup.isOk()).toBe(true);
    if (compact.isErr() || hyphenated.isErr() || lookup.isErr() || lookup.value === null) return;

    const compactToken = compact.value['nationalIdLookupToken'];
    expect(hyphenated.value['nationalIdLookupToken']).toBe(compactToken);
    expect(lookup.value).toEqual({
      nationalIdLookupToken: { in: [compactToken] },
    });
  });

  it('should reject an invalid national ID with a typed non-sensitive error', () => {
    const mapper = createMapper();
    const invalidNationalId = '2800901-9900332';

    const result = mapper.protectInput(
      { nationalId: invalidNationalId },
      'invalid-national-id-user',
    );

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.code).toBe('database.protection.invalid_lookup_value');
      expect(JSON.stringify(result.error.details)).not.toContain(invalidNationalId);
    }
  });
});
