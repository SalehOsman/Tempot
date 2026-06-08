import {
  type Prisma,
  type ProtectedDataService,
  type ProtectedFieldId,
  type ProtectedPayload,
} from '@tempot/database';
import { AppError, err, ok, type Result } from '@tempot/shared';
import type { MigrationDatabase } from './sensitive-data-migration.types.js';

const MIGRATION_ERROR = 'database.protection.migration_verification_failed';

type MigrationRow = Prisma.UserProfileGetPayload<Record<string, never>>;

export async function migrateAndVerifyRow(
  database: MigrationDatabase,
  service: ProtectedDataService,
  row: MigrationRow,
): Promise<Result<void, AppError>> {
  const data: Record<string, unknown> = {};
  const fields = migrationFields(row);
  for (const field of fields) {
    if (field.value === null || field.payload !== null) continue;
    const result = protectField(service, row.id, field);
    if (result.isErr()) return err(result.error);
    Object.assign(data, result.value);
  }

  await database.userProfile.update({
    where: { id: row.id },
    data: data as Prisma.UserProfileUpdateInput,
  });
  const migrated = await database.userProfile.findUnique({ where: { id: row.id } });
  return migrated ? verifyMigratedRow(service, migrated) : err(new AppError(MIGRATION_ERROR));
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
    const token = service.createLookupToken(field.value, field.fieldId);
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
    if (field.value === null) continue;
    if (!isPayload(field.payload)) return verificationError(row.id, field.fieldId);
    const recovered = service.recover(field.payload, {
      fieldId: field.fieldId,
      recordId: row.id,
    });
    if (recovered.isErr() || recovered.value !== field.value) {
      return verificationError(row.id, field.fieldId);
    }
    if (
      field.lookupToken !== undefined &&
      (field.fieldId === 'email' || field.fieldId === 'nationalId')
    ) {
      const token = service.createLookupToken(field.value, field.fieldId);
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

function verificationError(recordId: string, fieldId: ProtectedFieldId): Result<never, AppError> {
  return err(new AppError(MIGRATION_ERROR, { recordId, fieldId }));
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
