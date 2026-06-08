import { err, ok, type Result } from 'neverthrow';
import { AppError } from '@tempot/shared';
import { PROTECTED_DATA_ERRORS } from './protected-data.errors.js';
import type { ProtectedDataKey, ProtectedDataKeyProvider } from './protected-data.types.js';

export interface StaticProtectedDataKeyRing {
  activeEncryptionKeyVersion: string;
  encryptionKeys: Readonly<Record<string, Buffer>>;
  activeLookupKeyVersion: string;
  lookupKeys: Readonly<Record<string, Buffer>>;
}

export class StaticProtectedDataKeyProvider implements ProtectedDataKeyProvider {
  constructor(private readonly keyRing: StaticProtectedDataKeyRing) {}

  getActiveEncryptionKey(): Result<ProtectedDataKey, AppError> {
    return this.getEncryptionKey(this.keyRing.activeEncryptionKeyVersion);
  }

  getEncryptionKey(version: string): Result<ProtectedDataKey, AppError> {
    return this.resolveKey(this.keyRing.encryptionKeys, version, 'encryption');
  }

  getActiveLookupKey(): Result<ProtectedDataKey, AppError> {
    return this.getLookupKey(this.keyRing.activeLookupKeyVersion);
  }

  getLookupKey(version: string): Result<ProtectedDataKey, AppError> {
    return this.resolveKey(this.keyRing.lookupKeys, version, 'lookup');
  }

  validate(): Result<void, AppError> {
    const activeEncryption = this.getActiveEncryptionKey();
    if (activeEncryption.isErr()) return err(activeEncryption.error);
    const activeLookup = this.getActiveLookupKey();
    if (activeLookup.isErr()) return err(activeLookup.error);

    const invalidKey = [
      ...Object.values(this.keyRing.encryptionKeys),
      ...Object.values(this.keyRing.lookupKeys),
    ].some((key) => key.length !== 32);
    if (invalidKey) return err(new AppError(PROTECTED_DATA_ERRORS.INVALID_KEY));

    const encryptionMaterial = new Set(
      Object.values(this.keyRing.encryptionKeys).map((key) => key.toString('base64')),
    );
    const reused = Object.values(this.keyRing.lookupKeys).some((key) =>
      encryptionMaterial.has(key.toString('base64')),
    );
    if (reused) return err(new AppError(PROTECTED_DATA_ERRORS.INVALID_KEY));

    return ok(undefined);
  }

  private resolveKey(
    keys: Readonly<Record<string, Buffer>>,
    version: string,
    purpose: 'encryption' | 'lookup',
  ): Result<ProtectedDataKey, AppError> {
    const key = keys[version];
    if (!key) {
      return err(
        new AppError(PROTECTED_DATA_ERRORS.UNKNOWN_KEY_VERSION, {
          keyVersion: version,
          purpose,
        }),
      );
    }
    return ok({ version, key });
  }
}
