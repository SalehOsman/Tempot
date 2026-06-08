import { describe, expect, it } from 'vitest';
import { ok } from 'neverthrow';
import {
  NodeProtectedDataService,
  type ProtectedDataKeyProvider,
} from '../../src/protection/protected-data.service.js';

const encryptionKeys = {
  'enc-v1': Buffer.alloc(32, 1),
  'enc-v2': Buffer.alloc(32, 2),
} as const;

const lookupKeys = {
  'lookup-v1': Buffer.alloc(32, 3),
  'lookup-v2': Buffer.alloc(32, 4),
} as const;

function createProvider(
  activeEncryptionVersion: keyof typeof encryptionKeys = 'enc-v1',
  activeLookupVersion: keyof typeof lookupKeys = 'lookup-v1',
): ProtectedDataKeyProvider {
  return {
    getActiveEncryptionKey: () =>
      ok({
        version: activeEncryptionVersion,
        key: encryptionKeys[activeEncryptionVersion],
      }),
    getEncryptionKey: (version) => {
      const key = encryptionKeys[version as keyof typeof encryptionKeys];
      return key
        ? ok({ version, key })
        : (() => {
            throw new Error('Unknown test encryption key');
          })();
    },
    getActiveLookupKey: () =>
      ok({
        version: activeLookupVersion,
        key: lookupKeys[activeLookupVersion],
      }),
    getLookupKey: (version) => {
      const key = lookupKeys[version as keyof typeof lookupKeys];
      return key
        ? ok({ version, key })
        : (() => {
            throw new Error('Unknown test lookup key');
          })();
    },
    validate: () => ok(undefined),
  };
}

describe('NodeProtectedDataService', () => {
  it('protects and recovers an AES-256-GCM payload without storing plaintext', () => {
    const service = new NodeProtectedDataService(createProvider());
    const plaintext = 'alice@example.com';
    const context = { fieldId: 'email' as const, recordId: 'user-1' };

    const protectedResult = service.protect(plaintext, context);

    expect(protectedResult.isOk()).toBe(true);
    if (protectedResult.isErr()) return;

    const payload = protectedResult.value;
    expect(payload.algorithm).toBe('aes-256-gcm');
    expect(payload.keyVersion).toBe('enc-v1');
    expect(JSON.stringify(payload)).not.toContain(plaintext);

    const recoveryResult = service.recover(payload, context);
    expect(recoveryResult.isOk()).toBe(true);
    if (recoveryResult.isOk()) {
      expect(recoveryResult.value).toBe(plaintext);
    }
  });

  it('rejects tampered ciphertext with a typed integrity error', () => {
    const service = new NodeProtectedDataService(createProvider());
    const context = { fieldId: 'nationalId' as const, recordId: 'user-2' };
    const protectedResult = service.protect('29801011234567', context);
    expect(protectedResult.isOk()).toBe(true);
    if (protectedResult.isErr()) return;

    const payload = {
      ...protectedResult.value,
      ciphertext: Buffer.from('tampered').toString('base64'),
    };
    const recoveryResult = service.recover(payload, context);

    expect(recoveryResult.isErr()).toBe(true);
    if (recoveryResult.isErr()) {
      expect(recoveryResult.error.code).toBe('database.protection.integrity_failed');
      expect(JSON.stringify(recoveryResult.error.details)).not.toContain('29801011234567');
    }
  });

  it('normalizes email lookup values and separates token domains by field', () => {
    const service = new NodeProtectedDataService(createProvider());

    const first = service.createLookupToken(' Alice@Example.COM ', 'email');
    const second = service.createLookupToken('alice@example.com', 'email');
    const nationalId = service.createLookupToken('alice@example.com', 'nationalId');

    expect(first.isOk()).toBe(true);
    expect(second.isOk()).toBe(true);
    expect(nationalId.isOk()).toBe(true);
    if (first.isErr() || second.isErr() || nationalId.isErr()) return;

    expect(first.value.token).toBe(second.value.token);
    expect(first.value.token).not.toBe(nationalId.value.token);
    expect(first.value.normalizationVersion).toBe('email-v1');
  });

  it('reads an old payload and re-protects it with the active key version', () => {
    const oldService = new NodeProtectedDataService(createProvider('enc-v1', 'lookup-v1'));
    const context = { fieldId: 'birthDate' as const, recordId: 'user-3' };
    const original = oldService.protect('1998-01-01', context);
    expect(original.isOk()).toBe(true);
    if (original.isErr()) return;

    const rotatingService = new NodeProtectedDataService(createProvider('enc-v2', 'lookup-v2'));
    const rotated = rotatingService.reprotect(original.value, context);

    expect(rotated.isOk()).toBe(true);
    if (rotated.isErr()) return;
    expect(rotated.value.keyVersion).toBe('enc-v2');
    expect(rotatingService.recover(rotated.value, context)._unsafeUnwrap()).toBe('1998-01-01');
  });
});
