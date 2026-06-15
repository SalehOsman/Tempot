import { describe, expect, it } from 'vitest';
import { NodeProtectedDataService, StaticProtectedDataKeyProvider } from '../../src/index.js';

describe('readable lookup tokens', () => {
  it('should create exact tokens for every non-retired lookup key version', () => {
    const provider = new StaticProtectedDataKeyProvider({
      activeEncryptionKeyVersion: 'enc-v1',
      encryptionKeys: { 'enc-v1': Buffer.alloc(32, 61) },
      activeLookupKeyVersion: 'lookup-v3',
      lookupKeys: {
        'lookup-v1': Buffer.alloc(32, 62),
        'lookup-v2': Buffer.alloc(32, 63),
        'lookup-v3': Buffer.alloc(32, 64),
        'lookup-v0': Buffer.alloc(32, 65),
      },
      lookupKeyStates: {
        'lookup-v0': 'retired',
        'lookup-v1': 'readable',
        'lookup-v2': 'retiring',
        'lookup-v3': 'active',
      },
    });
    const service = new NodeProtectedDataService(provider);

    const versions = provider.getReadableLookupKeyVersions();
    const tokens = service.createLookupTokens(' Alice@Example.COM ', 'email');

    expect(versions.isOk()).toBe(true);
    expect(tokens.isOk()).toBe(true);
    if (versions.isErr() || tokens.isErr()) return;
    expect(new Set(versions.value)).toEqual(new Set(['lookup-v1', 'lookup-v2', 'lookup-v3']));
    expect(tokens.value.map((token) => token.tokenKeyVersion)).toEqual(versions.value);
    expect(new Set(tokens.value.map((token) => token.token)).size).toBe(3);
  });
});
