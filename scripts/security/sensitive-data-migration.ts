import { prisma } from '@tempot/database';
import { AppError, err, ok, type Result } from '@tempot/shared';
import {
  countLookupConflicts,
  loadCheckpoint,
  loadMigrationBatch,
  migrateAndVerifyRow,
  sanitizeHistoricalAudit,
  saveCheckpoint,
} from './sensitive-data-migration.persistence.js';
import type {
  CheckpointState,
  MigrationDatabase,
  SensitiveDataBackfillOptions,
  SensitiveDataBackfillReport,
} from './sensitive-data-migration.types.js';

export type {
  SensitiveDataBackfillOptions,
  SensitiveDataBackfillReport,
} from './sensitive-data-migration.types.js';

const MIGRATION_ERROR = 'database.protection.migration_verification_failed';

export async function runSensitiveDataBackfill(
  options: SensitiveDataBackfillOptions,
): Promise<Result<SensitiveDataBackfillReport, AppError>> {
  const database = options.database ?? prisma;
  const duplicateCount = await countLookupConflicts(database);
  const initial = emptyReport(options.migrationId, duplicateCount);
  if (options.dryRun) return ok({ ...initial, status: 'dry-run' });
  if (duplicateCount > 0) return conflictError(options.migrationId, duplicateCount);

  const batchResult = await processBatches(database, options);
  if (batchResult.isErr()) return err(batchResult.error);
  if (batchResult.value.paused) {
    return ok({
      ...initial,
      status: 'paused',
      processedCount: batchResult.value.state.processedCount,
      verifiedCount: batchResult.value.state.verifiedCount,
    });
  }

  return finalizeMigration({
    database,
    options,
    report: initial,
    state: batchResult.value.state,
  });
}

export async function assertSensitiveDataCutoverReady(
  database: MigrationDatabase,
  migrationId: string,
): Promise<Result<void, AppError>> {
  const checkpoint = await loadCheckpoint(database, migrationId);
  if (
    !checkpoint ||
    checkpoint.status !== 'READY_FOR_CUTOVER' ||
    checkpoint.failureCount !== 0 ||
    checkpoint.processedCount !== checkpoint.verifiedCount
  ) {
    return err(new AppError(MIGRATION_ERROR, { migrationId }));
  }
  return ok(undefined);
}

async function processBatches(
  database: MigrationDatabase,
  options: SensitiveDataBackfillOptions,
): Promise<Result<{ state: CheckpointState; paused: boolean }, AppError>> {
  const checkpoint = await loadCheckpoint(database, options.migrationId);
  const state = checkpointState(checkpoint);
  let batchCount = 0;

  while (true) {
    const rows = await loadMigrationBatch(database, state.cursor, options.batchSize);
    if (rows.length === 0) return ok({ state, paused: false });
    for (const row of rows) {
      const result = await migrateAndVerifyRow(database, options.protectionService, row);
      if (result.isErr()) return err(result.error);
      state.cursor = row.id;
      state.processedCount += 1;
      state.verifiedCount += 1;
    }
    batchCount += 1;
    const paused = options.stopAfterBatches !== undefined && batchCount >= options.stopAfterBatches;
    state.status = paused ? 'PAUSED' : 'RUNNING';
    await saveCheckpoint(database, options.migrationId, state);
    if (paused) return ok({ state, paused: true });
  }
}

async function finalizeMigration(
  params: FinalizeMigrationParams,
): Promise<Result<SensitiveDataBackfillReport, AppError>> {
  const { database, options, report, state } = params;
  const sanitizedAuditCount = await sanitizeHistoricalAudit(database);
  if (options.forceVerificationFailure) {
    state.failureCount = 1;
    state.status = 'FAILED';
    await saveCheckpoint(database, options.migrationId, state);
    return err(new AppError(MIGRATION_ERROR, safeCounts(options.migrationId, state)));
  }

  state.status = 'READY_FOR_CUTOVER';
  await saveCheckpoint(database, options.migrationId, state);
  return ok({
    ...report,
    status: 'ready-for-cutover',
    processedCount: state.processedCount,
    verifiedCount: state.verifiedCount,
    sanitizedAuditCount,
  });
}

interface FinalizeMigrationParams {
  database: MigrationDatabase;
  options: SensitiveDataBackfillOptions;
  report: SensitiveDataBackfillReport;
  state: CheckpointState;
}

function checkpointState(checkpoint: Awaited<ReturnType<typeof loadCheckpoint>>): CheckpointState {
  return {
    cursor: checkpoint?.cursor ?? null,
    processedCount: checkpoint?.processedCount ?? 0,
    verifiedCount: checkpoint?.verifiedCount ?? 0,
    failureCount: checkpoint?.failureCount ?? 0,
    status: checkpoint?.status ?? 'PENDING',
  };
}

function emptyReport(migrationId: string, duplicateCount: number): SensitiveDataBackfillReport {
  return {
    migrationId,
    status: 'dry-run',
    processedCount: 0,
    verifiedCount: 0,
    failureCount: 0,
    duplicateCount,
    sanitizedAuditCount: 0,
  };
}

function conflictError(migrationId: string, duplicateCount: number): Result<never, AppError> {
  return err(new AppError(MIGRATION_ERROR, { migrationId, duplicateCount }));
}

function safeCounts(migrationId: string, state: CheckpointState): Record<string, unknown> {
  return {
    migrationId,
    processedCount: state.processedCount,
    verifiedCount: state.verifiedCount,
    failureCount: state.failureCount,
  };
}
