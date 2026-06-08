import { describe, expect, it } from 'vitest';
import { StaticProtectedDataKeyProvider } from '../../src/protection/static-key.provider.js';

describe('StaticProtectedDataKeyProvider lifecycle', () => {
  it('distinguishes active, readable, retiring, and retired key versions', () => {
    const provider = new StaticProtectedDataKeyProvider({
      activeEncryptionKeyVersion: 'enc-v2',
      encryptionKeys: {
        'enc-v1': Buffer.alloc(32, 1),
        'enc-v2': Buffer.alloc(32, 2),
        'enc-v0': Buffer.alloc(32, 3),
      },
      activeLookupKeyVersion: 'lookup-v2',
      lookupKeys: {
        'lookup-v1': Buffer.alloc(32, 4),
        'lookup-v2': Buffer.alloc(32, 5),
      },
      encryptionKeyStates: {
        'enc-v0': 'retired',
        'enc-v1': 'retiring',
        'enc-v2': 'active',
      },
      lookupKeyStates: {
        'lookup-v1': 'readable',
        'lookup-v2': 'active',
      },
    });

    expect(provider.getEncryptionKeyState('enc-v2')).toBe('active');
    expect(provider.getEncryptionKeyState('enc-v1')).toBe('retiring');
    expect(provider.getLookupKeyState('lookup-v1')).toBe('readable');
    expect(provider.getEncryptionKey('enc-v0').isErr()).toBe(true);
  });
});
