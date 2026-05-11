import { AppError } from '@tempot/shared';
import { ok, err, type Result } from 'neverthrow';
import type {
  Template,
  TemplateVersion,
  TemplateVersionMetadata,
} from '../types/template.types.js';
import type { TemplateRepository } from '../repositories/template.repository.js';
import type { VersionRepository } from '../repositories/version.repository.js';
import type { ModuleEventBus } from '../index.js';
import { TEMPLATE_EVENTS } from '../events/event-names.js';

export type VersionBumpType = 'major' | 'minor' | 'patch';

export class VersionService {
  constructor(
    private readonly templateRepository: TemplateRepository,
    private readonly versionRepository: VersionRepository,
    private readonly eventBus: ModuleEventBus,
  ) {}

  async createSnapshot(input: {
    templateId: string;
    bumpType: VersionBumpType;
    publishedBy: string;
    changeSummary?: string;
  }): Promise<Result<TemplateVersion, AppError>> {
    const { templateId, bumpType, publishedBy, changeSummary } = input;
    const templateResult = await this.templateRepository.findById(templateId);
    if (templateResult.isErr()) return err(templateResult.error);

    const template = templateResult.value;
    const nextVersion = this.computeNextVersion(template.currentVersion, bumpType);

    const metadata: TemplateVersionMetadata = {
      name: template.name,
      description: template.description,
      categorySlug: null,
      tags: [],
      language: template.language,
      isOfficial: template.isOfficial,
    };

    const snapshotResult = await this.versionRepository.createSnapshot({
      templateId,
      version: nextVersion,
      content: template.content,
      metadata,
      changeSummary,
      publishedBy,
    });

    if (snapshotResult.isErr()) return err(snapshotResult.error);

    await this.templateRepository.update(templateId, { currentVersion: nextVersion });

    await this.eventBus.publish(TEMPLATE_EVENTS.VERSION_PUBLISHED, {
      templateId,
      versionId: snapshotResult.value.id,
      version: nextVersion,
      publishedBy,
      timestamp: new Date(),
    });

    return ok(snapshotResult.value);
  }

  async listVersions(templateId: string): Promise<Result<TemplateVersion[], AppError>> {
    return this.versionRepository.findByTemplate(templateId);
  }

  async getVersion(
    templateId: string,
    version: string,
  ): Promise<Result<TemplateVersion, AppError>> {
    return this.versionRepository.findByVersion(templateId, version);
  }

  suggestBumpType(current: Template, previous: TemplateVersion | null): VersionBumpType {
    if (!previous) return 'minor';

    const prevCommands = previous.content.commands.map((c) => c.name).sort();
    const currCommands = current.content.commands.map((c) => c.name).sort();

    const removedCommands = prevCommands.filter((c) => !currCommands.includes(c));
    if (removedCommands.length > 0) return 'major';

    const addedCommands = currCommands.filter((c) => !prevCommands.includes(c));
    if (addedCommands.length > 0) return 'minor';

    return 'patch';
  }

  private computeNextVersion(current: string | null, bumpType: VersionBumpType): string {
    if (!current) return '1.0.0';

    const parts = current.split('.').map(Number);
    const major = parts[0] ?? 1;
    const minor = parts[1] ?? 0;
    const patch = parts[2] ?? 0;

    switch (bumpType) {
      case 'major':
        return `${major + 1}.0.0`;
      case 'minor':
        return `${major}.${minor + 1}.0`;
      case 'patch':
        return `${major}.${minor}.${patch + 1}`;
    }
  }
}
