import { AppError } from '@tempot/shared';
import { err, type Result } from 'neverthrow';
import type { Template } from '../types/template.types.js';
import { TemplateStatus } from '../types/template.types.js';
import { templateBundleSchema } from '../contracts/template-bundle.schema.js';
import type { TemplateBundleSchemaInput } from '../contracts/template-bundle.schema.js';
import type { TemplateRepository } from '../repositories/template.repository.js';
import type { CategoryRepository } from '../repositories/category.repository.js';
import type { TagRepository } from '../repositories/tag.repository.js';

const MAX_BUNDLE_SIZE_BYTES = 5 * 1024 * 1024;

export class ImportService {
  constructor(
    private readonly templateRepository: TemplateRepository,
    private readonly categoryRepository: CategoryRepository,
    private readonly tagRepository: TagRepository,
  ) {}

  async importBundle(rawJson: string, userId: string): Promise<Result<Template, AppError>> {
    if (rawJson.length > MAX_BUNDLE_SIZE_BYTES) {
      return err(new AppError('template-management.file_too_large'));
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(rawJson);
    } catch {
      return err(new AppError('template-management.invalid_json'));
    }

    const validation = templateBundleSchema.safeParse(parsed);
    if (!validation.success) {
      return err(
        new AppError('template-management.bundle_validation_failed', {
          errors: validation.error.flatten().fieldErrors,
        }),
      );
    }

    const bundle: TemplateBundleSchemaInput = validation.data;

    const categoryId = await this.resolveCategory(bundle.metadata.category);
    await this.resolveTags(bundle.metadata.tags ?? []);

    const slug = this.generateSlug(bundle.metadata.name);

    return this.templateRepository.create({
      name: bundle.metadata.name,
      description: bundle.metadata.description,
      slug,
      status: TemplateStatus.DRAFT,
      content: bundle.content as unknown as Record<string, unknown>,
      categoryId,
      authorId: userId,
      clonedFrom: null,
      language: bundle.metadata.language,
      usageCount: 0,
      ratingAvg: 0,
      ratingCount: 0,
      currentVersion: null,
      isOfficial: false,
    });
  }

  private async resolveCategory(categorySlug: string | undefined): Promise<string | null> {
    if (!categorySlug) return null;
    const result = await this.categoryRepository.findBySlug(categorySlug);
    if (result.isOk()) return result.value.id;
    return null;
  }

  private async resolveTags(tagNames: string[]): Promise<void> {
    for (const name of tagNames) {
      await this.tagRepository.createOrFind(name);
    }
  }

  private generateSlug(name: string): string {
    const base = name
      .toLowerCase()
      .replace(/[^a-z0-9\u0600-\u06FF]+/g, '-')
      .replace(/^-|-$/g, '');
    const suffix = Date.now().toString(36).slice(-4);
    return `${base}-${suffix}`;
  }
}
