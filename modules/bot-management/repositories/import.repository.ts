import type { Result } from 'neverthrow';
import { AppError } from '@tempot/shared';
import { ModuleBaseRepository } from './module-base.repository.js';

export interface BotProfileImportRecord {
  id: string;
  requestedBy: string;
  sourceArtifactId: string;
  createdBotId: string | null;
  status: string;
  validationErrors: Record<string, unknown>[] | null;
  blockedRequirements: Record<string, unknown>[] | null;
  createdAt: Date;
  completedAt: Date | null;
}

export class BotProfileImportRepository extends ModuleBaseRepository<BotProfileImportRecord> {
  protected moduleName = 'bot-management';
  protected entityName = 'botProfileImport';

  protected get model() {
    return (this.db as unknown as Record<string, object>)['botProfileImport'];
  }

  async createRequest(
    requestedBy: string,
    sourceArtifactId: string,
  ): Promise<Result<BotProfileImportRecord, AppError>> {
    return this.create({
      id: `import-${crypto.randomUUID()}`,
      requestedBy,
      sourceArtifactId,
      createdBotId: null,
      status: 'PENDING',
      validationErrors: null,
      blockedRequirements: null,
      createdAt: new Date(),
      completedAt: null,
    });
  }

  async complete(
    id: string,
    createdBotId: string,
    blockedRequirements: Record<string, unknown>[],
  ): Promise<Result<BotProfileImportRecord, AppError>> {
    return this.update(id, {
      createdBotId,
      blockedRequirements,
      status: 'COMPLETED',
      completedAt: new Date(),
    });
  }
}
