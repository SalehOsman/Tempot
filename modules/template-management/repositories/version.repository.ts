import { AppError } from '@tempot/shared';
import { ok, err, type Result } from 'neverthrow';
import { ModuleBaseRepository } from './module-base.repository.js';
import type {
  TemplateVersion,
  TemplateContent,
  TemplateVersionMetadata,
} from '../types/template.types.js';

export interface CreateVersionInput {
  templateId: string;
  version: string;
  content: TemplateContent;
  metadata: TemplateVersionMetadata;
  changeSummary?: string;
  publishedBy: string;
}

export class VersionRepository extends ModuleBaseRepository<TemplateVersion> {
  protected moduleName = 'template-management';
  protected entityName = 'templateVersion';

  protected get model() {
    return (this.db as Record<string, unknown>)['templateVersion'] as object;
  }

  async createSnapshot(input: CreateVersionInput): Promise<Result<TemplateVersion, AppError>> {
    return this.create({
      templateId: input.templateId,
      version: input.version,
      content: input.content as unknown as Record<string, unknown>,
      metadata: input.metadata as unknown as Record<string, unknown>,
      changeSummary: input.changeSummary ?? null,
      publishedBy: input.publishedBy,
    });
  }

  async findByTemplate(templateId: string): Promise<Result<TemplateVersion[], AppError>> {
    return this.findMany({ templateId });
  }

  async findByVersion(
    templateId: string,
    version: string,
  ): Promise<Result<TemplateVersion, AppError>> {
    const result = await this.findMany({ templateId, version });
    if (result.isErr()) return err(result.error);
    const entry = result.value[0];
    if (!entry)
      return err(new AppError('template-management.version_not_found', { templateId, version }));
    return ok(entry);
  }

  async getLatestVersion(templateId: string): Promise<Result<TemplateVersion | null, AppError>> {
    const result = await this.findMany({ templateId });
    if (result.isErr()) return err(result.error);
    if (result.value.length === 0) return ok(null);
    const sorted = result.value.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return ok(sorted[0] ?? null);
  }
}
