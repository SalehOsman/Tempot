import type { Result } from 'neverthrow';
import type { AppError } from '@tempot/shared';

export type ProtectedFieldId = 'email' | 'nationalId' | 'mobileNumber' | 'birthDate';
export type LookupProtectedFieldId = 'email' | 'nationalId';
export type ProtectedDataKeyState = 'active' | 'readable' | 'retiring' | 'retired';

export interface ProtectedDataContext {
  fieldId: ProtectedFieldId;
  recordId: string;
}

export interface ProtectedPayload {
  formatVersion: 1;
  algorithm: 'aes-256-gcm';
  keyVersion: string;
  nonce: string;
  ciphertext: string;
  authTag: string;
}

export interface ProtectedLookupToken {
  fieldId: LookupProtectedFieldId;
  normalizationVersion: 'email-v1' | 'national-id-v1';
  tokenKeyVersion: string;
  token: string;
}

export interface ProtectedDataKey {
  version: string;
  key: Buffer;
}

export interface ProtectedDataKeyProvider {
  getActiveEncryptionKey(): Result<ProtectedDataKey, AppError>;
  getEncryptionKey(version: string): Result<ProtectedDataKey, AppError>;
  getActiveLookupKey(): Result<ProtectedDataKey, AppError>;
  getLookupKey(version: string): Result<ProtectedDataKey, AppError>;
  getReadableLookupKeyVersions(): Result<readonly string[], AppError>;
  validate(): Result<void, AppError>;
}

export interface ProtectedDataService {
  protect(value: string, context: ProtectedDataContext): Result<ProtectedPayload, AppError>;
  recover(payload: ProtectedPayload, context: ProtectedDataContext): Result<string, AppError>;
  createLookupToken(
    value: string,
    fieldId: LookupProtectedFieldId,
  ): Result<ProtectedLookupToken, AppError>;
  createLookupTokens(
    value: string,
    fieldId: LookupProtectedFieldId,
  ): Result<readonly ProtectedLookupToken[], AppError>;
  reprotect(
    payload: ProtectedPayload,
    context: ProtectedDataContext,
  ): Result<ProtectedPayload, AppError>;
}
