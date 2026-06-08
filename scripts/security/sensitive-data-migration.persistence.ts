import type { Prisma } from '@tempot/database';
import { omitSensitiveData } from '@tempot/shared';
import { migrateAndVerifyRow } from './sensitive-data-migration.row.js';
import type { CheckpointState, MigrationDatabase } from './sensitive-data-migration.types.js';

export async function loadMigrationBatch(
  database: MigrationDatabase,
  cursor: string | null,
  batchSize: number,
) {
  return database.userProfile.findMany({
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
}

export { migrateAndVerifyRow };

export async function sanitizeHistoricalAudit(database: MigrationDatabase): Promise<number> {
  const records = await database.auditLog.findMany();
  let sanitizedCount = 0;
  for (const record of records) {
    const before = omitSensitiveData(record.before);
    const after = omitSensitiveData(record.after);
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
  return sanitizedCount;
}

export async function countLookupConflicts(database: MigrationDatabase): Promise<number> {
  const rows = await database.userProfile.findMany({
    select: { email: true, nationalId: true },
  });
  return (
    duplicateGroups(rows.map((row) => row.email?.trim().toLowerCase() ?? null)) +
    duplicateGroups(rows.map((row) => row.nationalId?.trim() ?? null))
  );
}

export function loadCheckpoint(database: MigrationDatabase, migrationId: string) {
  return database.sensitiveDataMigrationCheckpoint.findUnique({ where: { migrationId } });
}

export async function saveCheckpoint(
  database: MigrationDatabase,
  migrationId: string,
  state: CheckpointState,
): Promise<void> {
  await database.sensitiveDataMigrationCheckpoint.upsert({
    where: { migrationId },
    create: { migrationId, phase: 'backfill', ...state },
    update: state,
  });
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
