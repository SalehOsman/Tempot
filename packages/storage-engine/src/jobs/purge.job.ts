import { ok, err } from 'neverthrow';
import type { Result, AsyncResult } from '@tempot/shared';
import { AppError, queueFactory } from '@tempot/shared';
import type { ShutdownManager } from '@tempot/shared';
import type { StorageFileDeletedPayload } from '../storage.contracts.js';
import type { Attachment } from '../storage.types.js';
import { STORAGE_ERRORS } from '../storage.errors.js';
import { storageToggle } from '../storage.toggle.js';

/** Minimal interfaces for purge job dependencies */

interface PurgeAttachmentRepo {
  findExpiredDeleted(beforeDate: Date): Promise<Result<Attachment[], AppError>>;
  hardDelete(ids: string[]): Promise<Result<void, AppError>>;
}

interface PurgeProvider {
  type: string;
  delete(key: string): AsyncResult<void, AppError>;
}

interface PurgeEventBus {
  publish(eventName: string, payload: unknown): AsyncResult<void, AppError>;
}

interface PurgeLogger {
  info: (data: unknown) => void;
  warn: (data: unknown) => void;
  error: (data: unknown) => void;
  debug: (data: unknown) => void;
}

/** Dependencies for the purge processing function */
export interface PurgeDeps {
  attachmentRepo: PurgeAttachmentRepo;
  provider: PurgeProvider;
  eventBus: PurgeEventBus;
  logger: PurgeLogger;
  retentionDays: number;
}

const PURGE_QUEUE_NAME = 'storage-purge';

/**
 * Create a BullMQ queue for scheduling purge jobs.
 * Uses `queueFactory` from `@tempot/shared` per Rule XX.
 * Accepts an optional ShutdownManager for graceful shutdown (Rule XVII).
 */
export function createPurgeQueue(
  shutdownManager?: ShutdownManager,
): ReturnType<typeof queueFactory> {
  return queueFactory(PURGE_QUEUE_NAME, { shutdownManager });
}

/**
 * Process a purge cycle: find expired soft-deleted records, delete from provider,
 * hard-delete from DB, and emit permanent deletion events.
 *
 * Extracted as a standalone function for testability (BullMQ Worker requires Redis).
 * FR-005, D6: Deferred deletion with configurable retention.
 */
export async function processPurge(deps: PurgeDeps): AsyncResult<void, AppError> {
  const disabled = storageToggle.check();
  if (disabled) return disabled;

  const { attachmentRepo, retentionDays, logger } = deps;

  const beforeDate = new Date();
  beforeDate.setDate(beforeDate.getDate() - retentionDays);

  const findResult = await attachmentRepo.findExpiredDeleted(beforeDate);
  if (findResult.isErr()) return err(findResult.error);

  const expired = findResult.value;
  if (expired.length === 0) return ok(undefined);

  let failureCount = 0;
  for (const record of expired) {
    const success = await purgeRecord(record, deps);
    if (!success) failureCount++;
  }

  if (failureCount > 0) {
    logger.warn({
      code: STORAGE_ERRORS.DELETE_FAILED,
      message: `Purge completed with failures`,
      total: expired.length,
      failed: failureCount,
      succeeded: expired.length - failureCount,
    });
  }

  return ok(undefined);
}

/** Purge a single record: delete from provider, hard-delete DB, emit event */
async function purgeRecord(record: Attachment, deps: PurgeDeps): Promise<boolean> {
  const { provider, attachmentRepo, logger } = deps;
  // Delete file from provider
  const deleteResult = await provider.delete(record.providerKey);
  if (deleteResult.isErr()) {
    logger.warn({
      code: STORAGE_ERRORS.DELETE_FAILED,
      attachmentId: record.id,
      providerKey: record.providerKey,
      error: deleteResult.error.code,
    });
    return false;
  }

  // Hard-delete from DB
  const hardDeleteResult = await attachmentRepo.hardDelete([record.id]);
  if (hardDeleteResult.isErr()) {
    logger.warn({
      code: STORAGE_ERRORS.HARD_DELETE_FAILED,
      attachmentId: record.id,
      error: hardDeleteResult.error.code,
    });
    return false;
  }

  // Emit permanent deletion event (fire-and-log)
  await emitPurgeEvent(record, deps);
  return true;
}

/** Emit deletion event for a purged record (fire-and-log) */
async function emitPurgeEvent(record: Attachment, deps: PurgeDeps): Promise<void> {
  const payload: StorageFileDeletedPayload = {
    attachmentId: record.id,
    provider: deps.provider.type,
    providerKey: record.providerKey,
    deletedBy: record.deletedBy ?? undefined,
    permanent: true,
  };
  const publishResult = await deps.eventBus.publish('storage.file.deleted', payload);
  if (publishResult.isErr()) {
    deps.logger.warn({
      code: STORAGE_ERRORS.EVENT_PUBLISH_FAILED,
      event: 'storage.file.deleted',
      attachmentId: record.id,
      error: publishResult.error.code,
    });
  }
}
