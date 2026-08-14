import { createCipheriv, createDecipheriv, createHmac, randomBytes } from 'node:crypto';
import { err, ok, type Result } from 'neverthrow';
import { AppError } from '@tempot/shared';
import { PROTECTED_DATA_ERRORS } from './protected-data.errors.js';
import type {
  LookupProtectedFieldId,
  ProtectedDataContext,
  ProtectedDataKey,
  ProtectedDataKeyProvider,
  ProtectedDataService,
  ProtectedLookupToken,
  ProtectedPayload,
} from './protected-data.types.js';

const ALGORITHM = 'aes-256-gcm';
const FORMAT_VERSION = 1;
const NONCE_LENGTH_BYTES = 12;
const KEY_LENGTH_BYTES = 32;

function validateKey(key: ProtectedDataKey): Result<ProtectedDataKey, AppError> {
  if (key.version.trim().length === 0 || key.key.length !== KEY_LENGTH_BYTES) {
    return err(
      new AppError(PROTECTED_DATA_ERRORS.INVALID_KEY, {
        keyVersion: key.version,
        expectedBytes: KEY_LENGTH_BYTES,
      }),
    );
  }
  return ok(key);
}

function authenticatedData(context: ProtectedDataContext, keyVersion: string): Buffer {
  return Buffer.from(
    `${FORMAT_VERSION}\u0000${context.fieldId}\u0000${context.recordId}\u0000${keyVersion}`,
    'utf8',
  );
}

function normalizeLookupValue(
  value: string,
  fieldId: LookupProtectedFieldId,
): { normalized: string; normalizationVersion: ProtectedLookupToken['normalizationVersion'] } {
  if (fieldId === 'email') {
    return {
      normalized: value.trim().toLowerCase(),
      normalizationVersion: 'email-v1',
    };
  }

  return {
    normalized: value.trim(),
    normalizationVersion: 'national-id-v1',
  };
}

export class NodeProtectedDataService implements ProtectedDataService {
  constructor(private readonly keyProvider: ProtectedDataKeyProvider) {}

  protect(value: string, context: ProtectedDataContext): Result<ProtectedPayload, AppError> {
    const providerValidation = this.keyProvider.validate();
    if (providerValidation.isErr()) return err(providerValidation.error);

    const keyResult = this.keyProvider.getActiveEncryptionKey().andThen(validateKey);
    if (keyResult.isErr()) return err(keyResult.error);

    try {
      const nonce = randomBytes(NONCE_LENGTH_BYTES);
      const cipher = createCipheriv(ALGORITHM, keyResult.value.key, nonce);
      cipher.setAAD(authenticatedData(context, keyResult.value.version));
      const ciphertext = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);

      return ok({
        formatVersion: FORMAT_VERSION,
        algorithm: ALGORITHM,
        keyVersion: keyResult.value.version,
        nonce: nonce.toString('base64'),
        ciphertext: ciphertext.toString('base64'),
        authTag: cipher.getAuthTag().toString('base64'),
      });
    } catch {
      return err(
        new AppError(PROTECTED_DATA_ERRORS.PROTECT_FAILED, {
          fieldId: context.fieldId,
          recordId: context.recordId,
          keyVersion: keyResult.value.version,
        }),
      );
    }
  }

  recover(payload: ProtectedPayload, context: ProtectedDataContext): Result<string, AppError> {
    if (payload.algorithm !== ALGORITHM || payload.formatVersion !== FORMAT_VERSION) {
      return err(
        new AppError(PROTECTED_DATA_ERRORS.INVALID_PAYLOAD, {
          fieldId: context.fieldId,
          recordId: context.recordId,
          keyVersion: payload.keyVersion,
        }),
      );
    }

    const keyResult = this.keyProvider.getEncryptionKey(payload.keyVersion).andThen(validateKey);
    if (keyResult.isErr()) return err(keyResult.error);

    try {
      const decipher = createDecipheriv(
        ALGORITHM,
        keyResult.value.key,
        Buffer.from(payload.nonce, 'base64'),
      );
      decipher.setAAD(authenticatedData(context, payload.keyVersion));
      decipher.setAuthTag(Buffer.from(payload.authTag, 'base64'));
      const plaintext = Buffer.concat([
        decipher.update(Buffer.from(payload.ciphertext, 'base64')),
        decipher.final(),
      ]);
      return ok(plaintext.toString('utf8'));
    } catch {
      return err(
        new AppError(PROTECTED_DATA_ERRORS.INTEGRITY_FAILED, {
          fieldId: context.fieldId,
          recordId: context.recordId,
          keyVersion: payload.keyVersion,
        }),
      );
    }
  }

  createLookupToken(
    value: string,
    fieldId: LookupProtectedFieldId,
  ): Result<ProtectedLookupToken, AppError> {
    const providerValidation = this.keyProvider.validate();
    if (providerValidation.isErr()) return err(providerValidation.error);

    const keyResult = this.keyProvider.getActiveLookupKey().andThen(validateKey);
    if (keyResult.isErr()) return err(keyResult.error);
    return this.createLookupTokenWithKey(value, fieldId, keyResult.value);
  }

  createLookupTokens(
    value: string,
    fieldId: LookupProtectedFieldId,
  ): Result<readonly ProtectedLookupToken[], AppError> {
    const providerValidation = this.keyProvider.validate();
    if (providerValidation.isErr()) return err(providerValidation.error);
    const versions = this.keyProvider.getReadableLookupKeyVersions();
    if (versions.isErr()) return err(versions.error);

    const tokens: ProtectedLookupToken[] = [];
    for (const version of versions.value) {
      const key = this.keyProvider.getLookupKey(version).andThen(validateKey);
      if (key.isErr()) return err(key.error);
      const token = this.createLookupTokenWithKey(value, fieldId, key.value);
      if (token.isErr()) return err(token.error);
      tokens.push(token.value);
    }
    return ok(tokens);
  }

  private createLookupTokenWithKey(
    value: string,
    fieldId: LookupProtectedFieldId,
    key: ProtectedDataKey,
  ): Result<ProtectedLookupToken, AppError> {
    const { normalized, normalizationVersion } = normalizeLookupValue(value, fieldId);
    const message = `${fieldId}\u0000${normalizationVersion}\u0000${normalized}`;
    const token = createHmac('sha256', key.key).update(message, 'utf8').digest('base64url');

    return ok({
      fieldId,
      normalizationVersion,
      tokenKeyVersion: key.version,
      token,
    });
  }

  reprotect(
    payload: ProtectedPayload,
    context: ProtectedDataContext,
  ): Result<ProtectedPayload, AppError> {
    return this.recover(payload, context).andThen((value) => this.protect(value, context));
  }
}

export type { ProtectedDataKeyProvider, ProtectedDataService } from './protected-data.types.js';
