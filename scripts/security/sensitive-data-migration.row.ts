import {
  type Prisma,
  type ProtectedDataService,
  type ProtectedFieldId,
  type ProtectedPayload,
} from '@tempot/database';
import { AppError, err, ok, type Result } from '@tempot/shared';
import {
  MIGRATION_VERIFICATION_ERROR,
  migrationConcurrentUpdateError,
  migrationDatabaseError,
} from './sensitive-data-migration.error.js';
import { canonicalizeNationalId } from './sensitive-data-national-id.js';
import type { MigrationDatabase } from './sensitive-data-migration.types.js';

export type MigrationRow = Prisma.UserProfileGetPayload<Record<string, never>>;

export async function migrateAndVerifyRow(
  database: MigrationDatabase,
  service: ProtectedDataService,
  row: MigrationRow,
): Promise<Result<void, AppError>> {
  const data = buildProtectedUpdate(service, row);
  if (data.isErr()) return err(data.error);

  try {
    const update = await database.userProfile.updateMany({
      where: { id: row.id, updatedAt: row.updatedAt },
      data: data.value as Prisma.UserProfileUpdateInput,
    });
    if (update.count !== 1) return err(migrationConcurrentUpdateError(row.id));
    const migrated = await database.userProfile.findUnique({ where: { id: row.id } });
    return migrated ? verifyMigratedRow(service, migrated) : verificationError(row.id);
  } catch {
    return err(migrationDatabaseError('userProfile.migrateAndVerify'));
  }
}

function buildProtectedUpdate(
  service: ProtectedDataService,
  row: MigrationRow,
): Result<Record<string, unknown>, AppError> {
  const data: Record<string, unknown> = {};
  for (const field of migrationFields(row)) {
    if (field.value === null || field.payload !== null) continue;
    const result = protectField(service, row.id, field);
    if (result.isErr()) return err(result.error);
    Object.assign(data, result.value);
  }
  return ok(data);
}

function protectField(
  service: ProtectedDataService,
  recordId: string,
  field: MigrationField,
): Result<Record<string, unknown>, AppError> {
  if (field.value === null) return ok({});
  const protection = service.protect(field.value, {
    fieldId: field.fieldId,
    recordId,
  });
  if (protection.isErr()) return err(protection.error);

  const output: Record<string, unknown> = { [field.protectedColumn]: protection.value };
  if (field.fieldId === 'email' || field.fieldId === 'nationalId') {
    const lookupValue =
      field.fieldId === 'nationalId' ? canonicalizeNationalId(field.value) : ok(field.value);
    if (lookupValue.isErr()) return err(lookupValue.error);
    const token = service.createLookupToken(lookupValue.value, field.fieldId);
    if (token.isErr()) return err(token.error);
    const prefix = field.fieldId === 'email' ? 'email' : 'nationalId';
    output[`${prefix}LookupToken`] = token.value.token;
    output[`${prefix}LookupKeyVersion`] = token.value.tokenKeyVersion;
    output[`${prefix}NormalizationVersion`] = token.value.normalizationVersion;
  }
  return ok(output);
}

function verifyMigratedRow(
  service: ProtectedDataService,
  row: MigrationRow,
): Result<void, AppError> {
  for (const field of migrationFields(row)) {
    if (field.value === null && field.payload === null) continue;
    if (!isPayload(field.payload)) return verificationError(row.id, field.fieldId);
    const recovered = service.recover(field.payload, {
      fieldId: field.fieldId,
      recordId: row.id,
    });
    if (recovered.isErr() || (field.value !== null && recovered.value !== field.value)) {
      return verificationError(row.id, field.fieldId);
    }
    if (
      field.value !== null &&
      field.lookupToken !== undefined &&
      (field.fieldId === 'email' || field.fieldId === 'nationalId')
    ) {
      const lookupValue =
        field.fieldId === 'nationalId' ? canonicalizeNationalId(field.value) : ok(field.value);
      if (lookupValue.isErr()) return err(lookupValue.error);
      const token = service.createLookupToken(lookupValue.value, field.fieldId);
      if (token.isErr() || token.value.token !== field.lookupToken) {
        return verificationError(row.id, field.fieldId);
      }
    }
  }
  return ok(undefined);
}

interface MigrationField {
  fieldId: ProtectedFieldId;
  protectedColumn: string;
  value: string | null;
  payload: unknown;
  lookupToken?: string | null;
}

function migrationFields(row: MigrationRow): MigrationField[] {
  return [
    {
      fieldId: 'email',
      protectedColumn: 'emailProtected',
      value: row.email,
      payload: row.emailProtected,
      lookupToken: row.emailLookupToken,
    },
    {
      fieldId: 'nationalId',
      protectedColumn: 'nationalIdProtected',
      value: row.nationalId,
      payload: row.nationalIdProtected,
      lookupToken: row.nationalIdLookupToken,
    },
    {
      fieldId: 'mobileNumber',
      protectedColumn: 'mobileNumberProtected',
      value: row.mobileNumber,
      payload: row.mobileNumberProtected,
    },
    {
      fieldId: 'birthDate',
      protectedColumn: 'birthDateProtected',
      value: row.birthDate?.toISOString().slice(0, 10) ?? null,
      payload: row.birthDateProtected,
    },
  ];
}

function verificationError(recordId: string, fieldId?: ProtectedFieldId): Result<never, AppError> {
  return err(new AppError(MIGRATION_VERIFICATION_ERROR, { recordId, fieldId }));
}

function isPayload(value: unknown): value is ProtectedPayload {
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
