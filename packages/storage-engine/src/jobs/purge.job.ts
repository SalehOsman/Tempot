import { ok, err } from 'neverthrow';
import type { AsyncResult } from '@tempot/shared';
import { AppError } from '@tempot/shared';
import type { StorageFileDeletedPayload } from '../contracts.js';
import type { Attachment } from '../types.js';
import { STORAGE_ERRORS } from '../errors.js';

/** Minimal interfaces for purge job dependencies (avoids CJS/ESM import issues) */

interface PurgeAttachmentRepo {
  findExpiredDeleted(beforeDate: Date): Promise<{
    isOk(): boolean;
    isErr(): boolean;
    value: Attachment[];
    error: AppError;
  }>;
  hardDelete(ids: string[]): Promise<{
    isOk(): boolean;
    isErr(): boolean;
    error: AppError;
  }>;
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

/**
 * Process a purge cycle: find expired soft-deleted records, delete from provider,
 * hard-delete from DB, and emit permanent deletion events.
 *
 * Extracted as a standalone function for testability (BullMQ Worker requires Redis).
 * FR-005, D6: Deferred deletion with configurable retention.
 */
export async function processPurge(deps: PurgeDeps): AsyncResult<void, AppError> {
  const { attachmentRepo, retentionDays } = deps;

  const beforeDate = new Date();
  beforeDate.setDate(beforeDate.getDate() - retentionDays);

  const findResult = await attachmentRepo.findExpiredDeleted(beforeDate);
  if (findResult.isErr()) return err(findResult.error);

  const expired = findResult.value;
  if (expired.length === 0) return ok(undefined);

  for (const record of expired) {
    await purgeRecord(record, deps);
  }

  return ok(undefined);
}

/** Purge a single record: delete from provider, hard-delete DB, emit event */
async function purgeRecord(record: Attachment, deps: PurgeDeps): Promise<void> {
  const { provider, attachmentRepo, eventBus, logger } = deps;
  // Delete file from provider
  const deleteResult = await provider.delete(record.providerKey);
  if (deleteResult.isErr()) {
    logger.warn({
      code: STORAGE_ERRORS.DELETE_FAILED,
      attachmentId: record.id,
      providerKey: record.providerKey,
      error: deleteResult.error.code,
    });
    return; // Skip this record, continue with others
  }

  // Hard-delete from DB
  const hardDeleteResult = await attachmentRepo.hardDelete([record.id]);
  if (hardDeleteResult.isErr()) {
    logger.warn({
      code: STORAGE_ERRORS.HARD_DELETE_FAILED,
      attachmentId: record.id,
      error: hardDeleteResult.error.code,
    });
    return;
  }

  // Emit permanent deletion event (fire-and-log)
  const payload: StorageFileDeletedPayload = {
    attachmentId: record.id,
    provider: provider.type,
    providerKey: record.providerKey,
    deletedBy: record.deletedBy ?? undefined,
    permanent: true,
  };
  const publishResult = await eventBus.publish('storage.file.deleted', payload);
  if (publishResult.isErr()) {
    logger.warn({
      code: STORAGE_ERRORS.EVENT_PUBLISH_FAILED,
      event: 'storage.file.deleted',
      attachmentId: record.id,
      error: publishResult.error.code,
    });
  }
}
