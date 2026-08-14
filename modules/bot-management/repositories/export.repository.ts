import type { Result } from 'neverthrow';
import { AppError } from '@tempot/shared';
import { ModuleBaseRepository } from './module-base.repository.js';

export interface BotProfileExportRecord {
  id: string;
  botId: string;
  requestedBy: string;
  format: string;
  artifactId: string | null;
  status: string;
  createdAt: Date;
  completedAt: Date | null;
}

export class BotProfileExportRepository extends ModuleBaseRepository<BotProfileExportRecord> {
  protected moduleName = 'bot-management';
  protected entityName = 'botProfileExport';

  protected get model() {
    return (this.db as unknown as Record<string, object>)['botProfileExport'];
  }

  async createRequest(
    botId: string,
    requestedBy: string,
    format: string,
  ): Promise<Result<BotProfileExportRecord, AppError>> {
    return this.create({
      id: `export-${crypto.randomUUID()}`,
      botId,
      requestedBy,
      format,
      artifactId: null,
      status: 'PENDING',
      createdAt: new Date(),
      completedAt: null,
    });
  }

  async complete(
    id: string,
    artifactId: string,
  ): Promise<Result<BotProfileExportRecord, AppError>> {
    return this.update(id, { artifactId, status: 'COMPLETED', completedAt: new Date() });
  }
}
