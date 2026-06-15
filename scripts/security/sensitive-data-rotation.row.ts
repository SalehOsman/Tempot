import { type Prisma, type ProtectedDataService } from '@tempot/database';
import { AppError, err, ok, type Result } from '@tempot/shared';
import type {
  RotationDatabase,
  SensitiveDataRotationOptions,
} from './sensitive-data-rotation.types.js';
import {
  rotationConcurrentUpdateError,
  rotationDatabaseError,
} from './sensitive-data-rotation.error.js';
import { canonicalizeNationalId } from './sensitive-data-national-id.js';
import {
  isProtectedPayload,
  oldFieldReferenceCount,
  orphanedLookupCleanup,
  type RotationFieldMetadata,
} from './sensitive-data-rotation.metadata.js';

const ROTATION_ERROR = 'database.protection.rotation_verification_failed';
type RotationRow = Prisma.UserProfileGetPayload<Record<string, never>>;

export async function rotateAndVerifyRow(
  database: RotationDatabase,
  options: SensitiveDataRotationOptions,
  row: RotationRow,
): Promise<Result<number, AppError>> {
  try {
    const data: Record<string, unknown> = {};
    let rotatedFields = 0;
    for (const field of rotationFields(row)) {
      const cleanup = orphanedLookupCleanup(field);
      if (cleanup) {
        Object.assign(data, cleanup);
        rotatedFields += 1;
        continue;
      }
      if (!isProtectedPayload(field.payload)) continue;
      const result = rotateField(options, row.id, field);
      if (result.isErr()) return err(result.error);
      Object.assign(data, result.value.data);
      if (result.value.changed) rotatedFields += 1;
    }
    if (rotatedFields === 0) return ok(0);

    const update = await database.userProfile.updateMany({
      where: { id: row.id, updatedAt: row.updatedAt },
      data: data as Prisma.UserProfileUpdateInput,
    });
    if (update.count !== 1) return err(rotationConcurrentUpdateError(row.id));
    const verification = await verifyRotatedRow(database, options, row.id);
    return verification.map(() => rotatedFields);
  } catch {
    return err(rotationDatabaseError('rotate_user_profile'));
  }
}

export async function countOldReferences(
  database: RotationDatabase,
  encryptionKeyVersion: string,
  activeLookupKeyVersion: string,
): Promise<Result<number, AppError>> {
  try {
    const rows = await database.userProfile.findMany();
    return ok(
      rows.reduce(
        (count, row) =>
          count + oldReferenceCount(row, encryptionKeyVersion, activeLookupKeyVersion),
        0,
      ),
    );
  } catch {
    return err(rotationDatabaseError('count_old_references'));
  }
}

export function getActiveLookupKeyVersion(service: ProtectedDataService): Result<string, AppError> {
  return service.createLookupToken('', 'email').map((token) => token.tokenKeyVersion);
}

function rotateField(
  options: SensitiveDataRotationOptions,
  recordId: string,
  field: RotationField,
): Result<RotationFieldResult, AppError> {
  if (!isProtectedPayload(field.payload)) {
    return err(new AppError(ROTATION_ERROR, { recordId }));
  }
  const recovered = options.protectionService.recover(field.payload, {
    fieldId: field.fieldId,
    recordId,
  });
  if (recovered.isErr()) return err(recovered.error);

  const output: Record<string, unknown> = {};
  if (field.payload.keyVersion === options.fromEncryptionKeyVersion) {
    const protectedResult = options.protectionService.protect(recovered.value, {
      fieldId: field.fieldId,
      recordId,
    });
    if (protectedResult.isErr()) return err(protectedResult.error);
    output[field.protectedColumn] = protectedResult.value;
  }
  const lookup = addRotatedLookup(options.protectionService, field, recovered.value);
  if (lookup.isErr()) return err(lookup.error);
  Object.assign(output, lookup.value);
  return ok({ data: output, changed: Object.keys(output).length > 0 });
}

function addRotatedLookup(
  service: ProtectedDataService,
  field: RotationField,
  value: string,
): Result<Record<string, unknown>, AppError> {
  if (field.fieldId !== 'email' && field.fieldId !== 'nationalId') return ok({});
  const lookupValue = field.fieldId === 'nationalId' ? canonicalizeNationalId(value) : ok(value);
  if (lookupValue.isErr()) return err(lookupValue.error);
  const token = service.createLookupToken(lookupValue.value, field.fieldId);
  if (token.isErr()) return err(token.error);
  if (
    field.lookupToken === token.value.token &&
    field.lookupKeyVersion === token.value.tokenKeyVersion &&
    field.normalizationVersion === token.value.normalizationVersion
  ) {
    return ok({});
  }
  const prefix = field.fieldId === 'email' ? 'email' : 'nationalId';
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
  const lookupVersion = getActiveLookupKeyVersion(options.protectionService);
  if (lookupVersion.isErr()) return err(lookupVersion.error);
  const remaining =
    oldReferenceCount(row, options.fromEncryptionKeyVersion, lookupVersion.value) > 0;
  return remaining ? err(new AppError(ROTATION_ERROR, { recordId })) : ok(undefined);
}

interface RotationField extends RotationFieldMetadata {
  protectedColumn: string;
}

interface RotationFieldResult {
  data: Record<string, unknown>;
  changed: boolean;
}

function rotationFields(row: RotationRow): RotationField[] {
  return [
    {
      fieldId: 'email',
      protectedColumn: 'emailProtected',
      payload: row.emailProtected,
      lookupToken: row.emailLookupToken,
      lookupKeyVersion: row.emailLookupKeyVersion,
      normalizationVersion: row.emailNormalizationVersion,
    },
    {
      fieldId: 'nationalId',
      protectedColumn: 'nationalIdProtected',
      payload: row.nationalIdProtected,
      lookupToken: row.nationalIdLookupToken,
      lookupKeyVersion: row.nationalIdLookupKeyVersion,
      normalizationVersion: row.nationalIdNormalizationVersion,
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

function oldReferenceCount(
  row: RotationRow,
  encryptionKeyVersion: string,
  activeLookupKeyVersion: string,
): number {
  return rotationFields(row).reduce(
    (count, field) =>
      count + oldFieldReferenceCount(field, encryptionKeyVersion, activeLookupKeyVersion),
    0,
  );
}
