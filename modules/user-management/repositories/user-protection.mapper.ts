import { err, ok, type Result } from 'neverthrow';
import {
  PROTECTED_DATA_ERRORS,
  type LookupProtectedFieldId,
  type ProtectedDataService,
  type ProtectedFieldId,
  type ProtectedPayload,
} from '@tempot/database';
import { AppError } from '@tempot/shared';
import type { UserProfile } from '../types/index.js';

const PROTECTED_FIELDS = [
  ['email', 'emailProtected'],
  ['nationalId', 'nationalIdProtected'],
  ['mobileNumber', 'mobileNumberProtected'],
  ['birthDate', 'birthDateProtected'],
] as const;

export class UserProtectionMapper {
  constructor(private readonly service?: ProtectedDataService) {}

  protectInput(
    data: Record<string, unknown>,
    recordId: string,
  ): Result<Record<string, unknown>, AppError> {
    if (!PROTECTED_FIELDS.some(([field]) => data[field] !== undefined)) return ok(data);
    if (!this.service) return err(new AppError(PROTECTED_DATA_ERRORS.NOT_CONFIGURED));

    const output = { ...data };
    for (const [fieldId, protectedColumn] of PROTECTED_FIELDS) {
      const result = this.protectField({
        output,
        rawValue: data[fieldId],
        fieldId,
        protectedColumn,
        recordId,
      });
      if (result.isErr()) return err(result.error);
    }
    return ok(output);
  }

  recover(user: UserProfile): Result<UserProfile, AppError> {
    const record: Record<string, unknown> = { ...user };
    for (const [fieldId, protectedColumn] of PROTECTED_FIELDS) {
      const result = this.recoverField({
        record,
        fieldId,
        protectedColumn,
        recordId: user.id,
      });
      if (result.isErr()) return err(result.error);
    }
    return ok(record as unknown as UserProfile);
  }

  createEmailLookupToken(value: string): Result<string | null, AppError> {
    return this.createLookupToken(value, 'email');
  }

  createLookupToken(
    value: string,
    fieldId: LookupProtectedFieldId,
  ): Result<string | null, AppError> {
    if (!this.service) return ok(null);
    return this.service.createLookupToken(value, fieldId).map((token) => token.token);
  }

  private protectField(params: ProtectFieldParams): Result<void, AppError> {
    const { output, rawValue, fieldId, protectedColumn, recordId } = params;
    if (rawValue === undefined) return ok(undefined);
    if (rawValue === null) {
      output[fieldId] = null;
      output[protectedColumn] = null;
      return ok(undefined);
    }

    const logicalValue = toLogicalValue(rawValue);
    if (logicalValue === null) return invalidPayload(fieldId, recordId);
    const protection = this.service?.protect(logicalValue, { fieldId, recordId });
    if (!protection) return err(new AppError(PROTECTED_DATA_ERRORS.NOT_CONFIGURED));
    if (protection.isErr()) return err(protection.error);

    output[fieldId] = null;
    output[protectedColumn] = protection.value;
    return this.addLookupToken(output, logicalValue, fieldId);
  }

  private addLookupToken(
    output: Record<string, unknown>,
    logicalValue: string,
    fieldId: ProtectedFieldId,
  ): Result<void, AppError> {
    if (fieldId !== 'email' && fieldId !== 'nationalId') return ok(undefined);
    const token = this.service?.createLookupToken(logicalValue, fieldId);
    if (!token) return err(new AppError(PROTECTED_DATA_ERRORS.NOT_CONFIGURED));
    if (token.isErr()) return err(token.error);

    const prefix = fieldId === 'email' ? 'email' : 'nationalId';
    output[`${prefix}LookupToken`] = token.value.token;
    output[`${prefix}LookupKeyVersion`] = token.value.tokenKeyVersion;
    output[`${prefix}NormalizationVersion`] = token.value.normalizationVersion;
    return ok(undefined);
  }

  private recoverField(params: RecoverFieldParams): Result<void, AppError> {
    const { record, fieldId, protectedColumn, recordId } = params;
    const candidate = record[protectedColumn];
    if (candidate === null || candidate === undefined) return ok(undefined);
    if (!this.service) return err(new AppError(PROTECTED_DATA_ERRORS.NOT_CONFIGURED));
    if (!isProtectedPayload(candidate)) return invalidPayload(fieldId, recordId);

    const recovery = this.service.recover(candidate, { fieldId, recordId });
    if (recovery.isErr()) return err(recovery.error);
    record[fieldId] =
      fieldId === 'birthDate' ? new Date(`${recovery.value}T00:00:00.000Z`) : recovery.value;
    delete record[protectedColumn];
    return ok(undefined);
  }
}

interface ProtectFieldParams {
  output: Record<string, unknown>;
  rawValue: unknown;
  fieldId: ProtectedFieldId;
  protectedColumn: string;
  recordId: string;
}

interface RecoverFieldParams {
  record: Record<string, unknown>;
  fieldId: ProtectedFieldId;
  protectedColumn: string;
  recordId: string;
}

function toLogicalValue(value: unknown): string | null {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return typeof value === 'string' ? value : null;
}

function invalidPayload(fieldId: ProtectedFieldId, recordId: string): Result<never, AppError> {
  return err(
    new AppError(PROTECTED_DATA_ERRORS.INVALID_PAYLOAD, {
      fieldId,
      recordId,
    }),
  );
}

function isProtectedPayload(value: unknown): value is ProtectedPayload {
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
