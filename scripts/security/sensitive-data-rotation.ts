import { prisma } from '@tempot/database';
import { AppError, err, ok, type Result } from '@tempot/shared';
import {
  countOldReferences,
  getActiveLookupKeyVersion,
  rotateAndVerifyRow,
} from './sensitive-data-rotation.row.js';
import type {
  RotationDatabase,
  RotationState,
  SensitiveDataRotationOptions,
  SensitiveDataRotationReport,
} from './sensitive-data-rotation.types.js';
import { rotationDatabaseError } from './sensitive-data-rotation.error.js';

export type {
  SensitiveDataRotationOptions,
  SensitiveDataRotationReport,
} from './sensitive-data-rotation.types.js';

const ROTATION_ERROR = 'database.protection.rotation_verification_failed';

export async function runSensitiveDataRotation(
  options: SensitiveDataRotationOptions,
): Promise<Result<SensitiveDataRotationReport, AppError>> {
  try {
    return await executeRotation(options);
  } catch {
    return err(rotationDatabaseError('run_rotation'));
  }
}

async function executeRotation(
  options: SensitiveDataRotationOptions,
): Promise<Result<SensitiveDataRotationReport, AppError>> {
  const database = options.database ?? prisma;
  const lookupVersion = getActiveLookupKeyVersion(options.protectionService);
  if (lookupVersion.isErr()) return err(lookupVersion.error);
  const state = await loadRotationState(database, options.migrationId);
  const batchResult = await processRotationBatches(database, options, state);
  if (batchResult.isErr()) return err(batchResult.error);

  const references = await countOldReferences(
    database,
    options.fromEncryptionKeyVersion,
    lookupVersion.value,
  );
  if (references.isErr()) return err(references.error);
  if (batchResult.value.paused) {
    return ok(
      report({
        status: 'paused',
        state,
        remainingOldReferences: references.value,
        retirementReady: false,
      }),
    );
  }
  return finalizeRotation({
    database,
    migrationId: options.migrationId,
    state,
    remainingOldReferences: references.value,
  });
}

async function finalizeRotation(
  params: FinalizeRotationParams,
): Promise<Result<SensitiveDataRotationReport, AppError>> {
  const { database, migrationId, state, remainingOldReferences } = params;
  const retirementReady = remainingOldReferences === 0;
  await saveRotationCheckpoint({
    database,
    migrationId,
    state,
    status: retirementReady ? 'READY_FOR_RETIREMENT' : 'FAILED',
  });
  if (!retirementReady) {
    return err(new AppError(ROTATION_ERROR, { migrationId, remainingOldReferences }));
  }
  return ok(report({ status: 'complete', state, remainingOldReferences, retirementReady: true }));
}

async function processRotationBatches(
  database: RotationDatabase,
  options: SensitiveDataRotationOptions,
  state: RotationState,
): Promise<Result<{ paused: boolean }, AppError>> {
  let batchCount = 0;
  while (true) {
    const rows = await database.userProfile.findMany({
      where: { id: state.cursor ? { gt: state.cursor } : undefined },
      orderBy: { id: 'asc' },
      take: options.batchSize,
    });
    if (rows.length === 0) return ok({ paused: false });
    for (const row of rows) {
      const rotation = await rotateAndVerifyRow(database, options, row);
      if (rotation.isErr()) return err(rotation.error);
      state.rotatedFields += rotation.value;
      state.processedRows += 1;
      state.cursor = row.id;
    }
    batchCount += 1;
    const paused = options.stopAfterBatches !== undefined && batchCount >= options.stopAfterBatches;
    await saveRotationCheckpoint({
      database,
      migrationId: options.migrationId,
      state,
      status: paused ? 'PAUSED' : 'RUNNING',
    });
    if (paused) return ok({ paused: true });
  }
}

async function loadRotationState(
  database: RotationDatabase,
  migrationId: string,
): Promise<RotationState> {
  const checkpoint = await database.sensitiveDataMigrationCheckpoint.findUnique({
    where: { migrationId },
  });
  return {
    cursor: checkpoint?.cursor ?? null,
    processedRows: checkpoint?.processedCount ?? 0,
    rotatedFields: checkpoint?.verifiedCount ?? 0,
  };
}

async function saveRotationCheckpoint(params: SaveRotationCheckpointParams): Promise<void> {
  const { database, migrationId, state, status } = params;
  const values = {
    cursor: state.cursor,
    processedCount: state.processedRows,
    verifiedCount: state.rotatedFields,
    failureCount: status === 'FAILED' ? 1 : 0,
    status,
  };
  await database.sensitiveDataMigrationCheckpoint.upsert({
    where: { migrationId },
    create: { migrationId, phase: 'rotate', ...values },
    update: values,
  });
}

interface SaveRotationCheckpointParams {
  database: RotationDatabase;
  migrationId: string;
  state: RotationState;
  status: string;
}

interface FinalizeRotationParams {
  database: RotationDatabase;
  migrationId: string;
  state: RotationState;
  remainingOldReferences: number;
}

function report(params: ReportParams): SensitiveDataRotationReport {
  const { status, state, remainingOldReferences, retirementReady } = params;
  return {
    status,
    processedRows: state.processedRows,
    rotatedFields: state.rotatedFields,
    remainingOldReferences,
    retirementReady,
  };
}

interface ReportParams {
  status: SensitiveDataRotationReport['status'];
  state: RotationState;
  remainingOldReferences: number;
  retirementReady: boolean;
}
