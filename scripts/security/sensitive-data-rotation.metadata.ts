import type { ProtectedFieldId, ProtectedPayload } from '@tempot/database';

export interface RotationFieldMetadata {
  fieldId: ProtectedFieldId;
  payload: unknown;
  lookupToken?: string | null;
  lookupKeyVersion?: string | null;
  normalizationVersion?: string | null;
}

export function orphanedLookupCleanup(field: RotationFieldMetadata): Record<string, null> | null {
  if (isProtectedPayload(field.payload) || !hasLookupMetadata(field)) return null;
  const prefix = lookupPrefix(field.fieldId);
  if (!prefix) return null;
  return {
    [`${prefix}LookupToken`]: null,
    [`${prefix}LookupKeyVersion`]: null,
    [`${prefix}NormalizationVersion`]: null,
  };
}

export function oldFieldReferenceCount(
  field: RotationFieldMetadata,
  encryptionKeyVersion: string,
  activeLookupKeyVersion: string,
): number {
  if (!isProtectedPayload(field.payload)) return hasLookupMetadata(field) ? 1 : 0;
  const oldEncryption = field.payload.keyVersion === encryptionKeyVersion ? 1 : 0;
  const oldLookup = lookupPrefix(field.fieldId)
    ? hasCurrentLookupMetadata(field, activeLookupKeyVersion)
      ? 0
      : 1
    : 0;
  return oldEncryption + oldLookup;
}

export function isProtectedPayload(value: unknown): value is ProtectedPayload {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false;
  const payload = value as Record<string, unknown>;
  return (
    payload['formatVersion'] === 1 &&
    payload['algorithm'] === 'aes-256-gcm' &&
    typeof payload['keyVersion'] === 'string' &&
    typeof payload['nonce'] === 'string' &&
    typeof payload['ciphertext'] === 'string' &&
    typeof payload['authTag'] === 'string'
  );
}

function hasLookupMetadata(field: RotationFieldMetadata): boolean {
  return (
    (field.lookupToken !== null && field.lookupToken !== undefined) ||
    (field.lookupKeyVersion !== null && field.lookupKeyVersion !== undefined) ||
    (field.normalizationVersion !== null && field.normalizationVersion !== undefined)
  );
}

function hasCurrentLookupMetadata(
  field: RotationFieldMetadata,
  activeLookupKeyVersion: string,
): boolean {
  const expectedNormalization = field.fieldId === 'email' ? 'email-v1' : 'national-id-v1';
  return (
    typeof field.lookupToken === 'string' &&
    field.lookupToken.length > 0 &&
    field.lookupKeyVersion === activeLookupKeyVersion &&
    field.normalizationVersion === expectedNormalization
  );
}

function lookupPrefix(fieldId: ProtectedFieldId): 'email' | 'nationalId' | null {
  if (fieldId === 'email') return 'email';
  if (fieldId === 'nationalId') return 'nationalId';
  return null;
}
