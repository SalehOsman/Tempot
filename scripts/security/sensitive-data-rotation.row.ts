import {
  type Prisma,
  type ProtectedDataService,
  type ProtectedFieldId,
  type ProtectedPayload,
} from '@tempot/database';
import { AppError, err, ok, type Result } from '@tempot/shared';
import type {
  RotationDatabase,
  SensitiveDataRotationOptions,
} from './sensitive-data-rotation.types.js';

const ROTATION_ERROR = 'database.protection.rotation_verification_failed';
type RotationRow = Prisma.UserProfileGetPayload<Record<string, never>>;

export async function rotateAndVerifyRow(
  database: RotationDatabase,
  options: SensitiveDataRotationOptions,
  row: RotationRow,
): Promise<Result<number, AppError>> {
  const data: Record<string, unknown> = {};
  let rotatedFields = 0;
  for (const field of rotationFields(row)) {
    if (
      !isPayload(field.payload) ||
      field.payload.keyVersion !== options.fromEncryptionKeyVersion
    ) {
      continue;
    }
    const result = rotateField(options.protectionService, row.id, field);
    if (result.isErr()) return err(result.error);
    Object.assign(data, result.value);
    rotatedFields += 1;
  }
  if (rotatedFields === 0) return ok(0);

  await database.userProfile.update({
    where: { id: row.id },
    data: data as Prisma.UserProfileUpdateInput,
  });
  const verification = await verifyRotatedRow(database, options, row.id);
  return verification.map(() => rotatedFields);
}

export async function countOldReferences(
  database: RotationDatabase,
  keyVersion: string,
): Promise<number> {
  const rows = await database.userProfile.findMany();
  return rows.reduce(
    (count, row) =>
      count +
      rotationFields(row).filter(
        (field) => isPayload(field.payload) && field.payload.keyVersion === keyVersion,
      ).length,
    0,
  );
}

function rotateField(
  service: ProtectedDataService,
  recordId: string,
  field: RotationField,
): Result<Record<string, unknown>, AppError> {
  if (!isPayload(field.payload)) return err(new AppError(ROTATION_ERROR, { recordId }));
  const recovered = service.recover(field.payload, {
    fieldId: field.fieldId,
    recordId,
  });
  if (recovered.isErr()) return err(recovered.error);
  const protectedResult = service.protect(recovered.value, {
    fieldId: field.fieldId,
    recordId,
  });
  if (protectedResult.isErr()) return err(protectedResult.error);

  const output: Record<string, unknown> = {
    [field.protectedColumn]: protectedResult.value,
  };
  const lookup = addRotatedLookup(service, field.fieldId, recovered.value);
  if (lookup.isErr()) return err(lookup.error);
  return ok({ ...output, ...lookup.value });
}

function addRotatedLookup(
  service: ProtectedDataService,
  fieldId: ProtectedFieldId,
  value: string,
): Result<Record<string, unknown>, AppError> {
  if (fieldId !== 'email' && fieldId !== 'nationalId') return ok({});
  const token = service.createLookupToken(value, fieldId);
  if (token.isErr()) return err(token.error);
  const prefix = fieldId === 'email' ? 'email' : 'nationalId';
  return ok({
    [`${prefix}LookupToken`]: token.value.token,
    [`${prefix}LookupKeyVersion`]: token.value.tokenKeyVersion,
    [`${prefix}NormalizationVersion`]: token.value.normalizationVersion,
  });
}

async function verifyRotatedRow(
  database: RotationDatabase,
  options: SensitiveDataRotationOptions,
  recordId: string,
): Promise<Result<void, AppError>> {
  const row = await database.userProfile.findUnique({ where: { id: recordId } });
  if (!row) return err(new AppError(ROTATION_ERROR, { recordId }));
  const remaining = rotationFields(row).some(
    (field) =>
      isPayload(field.payload) && field.payload.keyVersion === options.fromEncryptionKeyVersion,
  );
  return remaining ? err(new AppError(ROTATION_ERROR, { recordId })) : ok(undefined);
}

interface RotationField {
  fieldId: ProtectedFieldId;
  protectedColumn: string;
  payload: unknown;
}

function rotationFields(row: RotationRow): RotationField[] {
  return [
    { fieldId: 'email', protectedColumn: 'emailProtected', payload: row.emailProtected },
    {
      fieldId: 'nationalId',
      protectedColumn: 'nationalIdProtected',
      payload: row.nationalIdProtected,
    },
    {
      fieldId: 'mobileNumber',
      protectedColumn: 'mobileNumberProtected',
      payload: row.mobileNumberProtected,
    },
    {
      fieldId: 'birthDate',
      protectedColumn: 'birthDateProtected',
      payload: row.birthDateProtected,
    },
  ];
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
