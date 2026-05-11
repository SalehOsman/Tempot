import { AppError } from '@tempot/shared';
import { ok, err, type Result } from 'neverthrow';
import type { Template } from '../types/template.types.js';
import type { TemplateRepository } from '../repositories/template.repository.js';
import type { VersionRepository } from '../repositories/version.repository.js';
import type { TemplateBundleSchemaInput } from '../contracts/template-bundle.schema.js';

export interface ExportResult {
  bundle: TemplateBundleSchemaInput;
  filename: string;
}

export class ExportService {
  constructor(
    private readonly templateRepository: TemplateRepository,
    private readonly versionRepository: VersionRepository,
  ) {}

  async exportAsJson(
    templateId: string,
    exportedBy: string,
  ): Promise<Result<ExportResult, AppError>> {
    const templateResult = await this.templateRepository.findById(templateId);
    if (templateResult.isErr()) return err(templateResult.error);

    const template = templateResult.value;
    const bundle = this.buildBundle(template, exportedBy);
    const filename = `${template.slug}-v${template.currentVersion ?? '0.0.0'}.json`;

    return ok({ bundle, filename });
  }

  async exportAsPdfRequest(
    templateId: string,
  ): Promise<Result<{ templateId: string; data: Record<string, unknown> }, AppError>> {
    const templateResult = await this.templateRepository.findById(templateId);
    if (templateResult.isErr()) return err(templateResult.error);

    const template = templateResult.value;
    const versionsResult = await this.versionRepository.findByTemplate(templateId);
    const versions = versionsResult.isOk() ? versionsResult.value : [];

    return ok({
      templateId,
      data: {
        name: template.name,
        description: template.description,
        commands: template.content.commands,
        messages: template.content.messages,
        versions: versions.map((v) => ({
          version: v.version,
          date: v.createdAt,
          summary: v.changeSummary,
        })),
        authorId: template.authorId,
        language: template.language,
      },
    });
  }

  private buildBundle(template: Template, exportedBy: string): TemplateBundleSchemaInput {
    return {
      $schema: 'tempot-template-bundle/1.0',
      metadata: {
        name: template.name,
        description: template.description,
        category: template.categoryId ?? undefined,
        tags: [],
        language: template.language,
        version: template.currentVersion ?? '1.0.0',
      },
      content: {
        commands: template.content.commands,
        messages: template.content.messages,
        inputForms: template.content.inputForms,
        permissions: template.content.permissions,
        settings: template.content.settings,
      },
      exportedAt: new Date().toISOString(),
      exportedBy,
      tempotVersion: '1.0.0',
    };
  }
}
