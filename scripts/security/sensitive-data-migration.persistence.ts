import {
  buildSafeAuditSnapshot,
  type Prisma,
  type ProtectedDataService,
  type ProtectedPayload,
} from '@tempot/database';
import { AppError, err, ok, type Result } from '@tempot/shared';
import { migrationDatabaseError } from './sensitive-data-migration.error.js';
import { migrateAndVerifyRow, type MigrationRow } from './sensitive-data-migration.row.js';
import { canonicalizeNationalId } from './sensitive-data-national-id.js';
import type { CheckpointState, MigrationDatabase } from './sensitive-data-migration.types.js';

export async function loadMigrationBatch(
  database: MigrationDatabase,
  cursor: string | null,
  batchSize: number,
): Promise<Result<MigrationRow[], AppError>> {
  try {
    const rows = await database.userProfile.findMany({
      where: {
        id: cursor ? { gt: cursor } : undefined,
        OR: [
          { email: { not: null } },
          { nationalId: { not: null } },
          { mobileNumber: { not: null } },
          { birthDate: { not: null } },
        ],
      },
      orderBy: { id: 'asc' },
      take: batchSize,
    });
    return ok(rows);
  } catch {
    return err(migrationDatabaseError('userProfile.loadMigrationBatch'));
  }
}

export { migrateAndVerifyRow };

export async function sanitizeHistoricalAudit(
  database: MigrationDatabase,
): Promise<Result<number, AppError>> {
  try {
    const records = await database.auditLog.findMany();
    let sanitizedCount = 0;
    for (const record of records) {
      const before = buildSafeAuditSnapshot(record.before);
      const after = buildSafeAuditSnapshot(record.after);
      if (!auditChanged(record.before, before) && !auditChanged(record.after, after)) continue;

      await database.auditLog.update({
        where: { id: record.id },
        data: {
          before: toJsonInput(before),
          after: toJsonInput(after),
        },
      });
      sanitizedCount += 1;
    }
    return ok(sanitizedCount);
  } catch {
    return err(migrationDatabaseError('auditLog.sanitizeHistorical'));
  }
}

export async function countLookupConflicts(
  database: MigrationDatabase,
  service: ProtectedDataService,
): Promise<Result<number, AppError>> {
  try {
    const rows = await database.userProfile.findMany({
      select: {
        id: true,
        email: true,
        emailProtected: true,
        emailLookupToken: true,
        nationalId: true,
        nationalIdProtected: true,
        nationalIdLookupToken: true,
      },
    });
    const emails = lookupKeys(rows, service, 'email');
    if (emails.isErr()) return err(emails.error);
    const nationalIds = lookupKeys(rows, service, 'nationalId');
    if (nationalIds.isErr()) return err(nationalIds.error);
    return ok(duplicateGroups(emails.value) + duplicateGroups(nationalIds.value));
  } catch {
    return err(migrationDatabaseError('userProfile.countLookupConflicts'));
  }
}

export async function loadCheckpoint(
  database: MigrationDatabase,
  migrationId: string,
): Promise<Result<CheckpointState | null, AppError>> {
  try {
    const checkpoint = await database.sensitiveDataMigrationCheckpoint.findUnique({
      where: { migrationId },
    });
    return ok(checkpoint);
  } catch {
    return err(migrationDatabaseError('checkpoint.load'));
  }
}

export async function saveCheckpoint(
  database: MigrationDatabase,
  migrationId: string,
  state: CheckpointState,
): Promise<Result<void, AppError>> {
  try {
    await database.sensitiveDataMigrationCheckpoint.upsert({
      where: { migrationId },
      create: { migrationId, phase: 'backfill', ...state },
      update: state,
    });
    return ok(undefined);
  } catch {
    return err(migrationDatabaseError('checkpoint.save'));
  }
}

interface ConflictRow {
  id: string;
  email: string | null;
  emailProtected: Prisma.JsonValue | null;
  emailLookupToken: string | null;
  nationalId: string | null;
  nationalIdProtected: Prisma.JsonValue | null;
  nationalIdLookupToken: string | null;
}

function lookupKeys(
  rows: ConflictRow[],
  service: ProtectedDataService,
  fieldId: 'email' | 'nationalId',
): Result<Array<string | null>, AppError> {
  const keys: Array<string | null> = [];
  for (const row of rows) {
    const value = lookupValue(row, service, fieldId);
    if (value.isErr()) return err(value.error);
    keys.push(value.value);
  }
  return ok(keys);
}

function lookupValue(
  row: ConflictRow,
  service: ProtectedDataService,
  fieldId: 'email' | 'nationalId',
): Result<string | null, AppError> {
  let value = fieldId === 'email' ? row.email : row.nationalId;
  const payload = fieldId === 'email' ? row.emailProtected : row.nationalIdProtected;
  const storedToken = fieldId === 'email' ? row.emailLookupToken : row.nationalIdLookupToken;
  if (value === null && isProtectedPayload(payload)) {
    const recovered = service.recover(payload, { fieldId, recordId: row.id });
    if (recovered.isErr()) return err(recovered.error);
    value = recovered.value;
  }
  if (value === null) return ok(storedToken);
  const lookupValue = fieldId === 'nationalId' ? canonicalizeNationalId(value) : ok(value);
  if (lookupValue.isErr()) return err(lookupValue.error);
  const token = service.createLookupToken(lookupValue.value, fieldId);
  return token.isErr() ? err(token.error) : ok(token.value.token);
}

function duplicateGroups(values: Array<string | null>): number {
  const counts = new Map<string, number>();
  for (const value of values) {
    if (value) counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return [...counts.values()].filter((count) => count > 1).length;
}

function auditChanged(original: unknown, sanitized: unknown): boolean {
  return JSON.stringify(original) !== JSON.stringify(sanitized);
}

function toJsonInput(value: unknown): Prisma.InputJsonValue {
  return (value ?? {}) as Prisma.InputJsonValue;
}

function isProtectedPayload(value: Prisma.JsonValue | null): value is ProtectedPayload {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false;
  return (
    value['formatVersion'] === 1 &&
    value['algorithm'] === 'aes-256-gcm' &&
    typeof value['keyVersion'] === 'string' &&
    typeof value['nonce'] === 'string' &&
    typeof value['ciphertext'] === 'string' &&
    typeof value['authTag'] === 'string'
  );
}
