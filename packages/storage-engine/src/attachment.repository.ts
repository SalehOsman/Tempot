import type { Result } from '@tempot/shared';
import { ok, err } from 'neverthrow';
import { AppError } from '@tempot/shared';
import { BaseRepository, type PrismaModelDelegate } from '@tempot/database';
import type { Attachment } from './storage.types.js';
import { STORAGE_ERRORS } from './storage.errors.js';

/**
 * Repository for Attachment entity (FR-003).
 *
 * Extends BaseRepository for standard CRUD with soft-delete.
 * Adds domain-specific queries: findByModuleAndEntity, findExpiredDeleted.
 * Provides hardDelete for permanent removal by purge job (DC4).
 */
export class AttachmentRepository extends BaseRepository<Attachment> {
  protected moduleName = 'storage';
  protected entityName = 'attachment';

  protected get model(): PrismaModelDelegate {
    return (this.db as Record<string, unknown>).attachment as PrismaModelDelegate;
  }

  /** Find attachments by module and entity */
  async findByModuleAndEntity(
    moduleId: string,
    entityId: string,
  ): Promise<Result<Attachment[], AppError>> {
    return this.findMany({ moduleId, entityId });
  }

  /** Find soft-deleted attachments older than given date (for purge job) */
  async findExpiredDeleted(beforeDate: Date): Promise<Result<Attachment[], AppError>> {
    return this.findMany({
      isDeleted: true,
      deletedAt: { lte: beforeDate },
    });
  }

  /** Permanently delete records by IDs (purge job only — bypasses soft-delete via $executeRaw) */
  async hardDelete(ids: string[]): Promise<Result<void, AppError>> {
    try {
      const dbClient = this.db as unknown as {
        $executeRaw: (strings: TemplateStringsArray, ...values: unknown[]) => Promise<number>;
      };
      await dbClient.$executeRaw`DELETE FROM "Attachment" WHERE id = ANY(${ids})`;
      return ok(undefined);
    } catch (error: unknown) {
      return err(new AppError(STORAGE_ERRORS.HARD_DELETE_FAILED, error));
    }
  }
}

export type { IAuditLogger } from '@tempot/database';
