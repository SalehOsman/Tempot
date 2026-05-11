import { AppError } from '@tempot/shared';
import { ok, err, type Result } from 'neverthrow';
import type {
  Template,
  CreateTemplateInput,
  UpdateTemplateInput,
  TemplateContent,
  TemplateSearchParams,
  TemplateSearchResult,
} from '../types/template.types.js';
import { TemplateStatus } from '../types/template.types.js';
import { createTemplateSchema } from '../contracts/template-content.schema.js';
import type { TemplateRepository } from '../repositories/template.repository.js';
import type { ModuleEventBus } from '../index.js';
import { TEMPLATE_EVENTS } from '../events/event-names.js';

export class TemplateService {
  constructor(
    private readonly templateRepository: TemplateRepository,
    private readonly eventBus: ModuleEventBus,
  ) {}

  async create(input: CreateTemplateInput, authorId: string): Promise<Result<Template, AppError>> {
    const validation = createTemplateSchema.safeParse(input);
    if (!validation.success) {
      return err(
        new AppError('template-management.validation_failed', {
          errors: validation.error.flatten().fieldErrors,
        }),
      );
    }

    const slug = this.generateSlug(input.name);
    const emptyContent: TemplateContent = {
      commands: [],
      messages: [],
    };

    const result = await this.templateRepository.create({
      name: input.name,
      description: input.description,
      slug,
      status: TemplateStatus.DRAFT,
      content: emptyContent as unknown as Record<string, unknown>,
      categoryId: input.categoryId ?? null,
      authorId,
      clonedFrom: null,
      language: input.language,
      usageCount: 0,
      ratingAvg: 0,
      ratingCount: 0,
      currentVersion: null,
      isOfficial: false,
    });

    if (result.isErr()) return err(result.error);

    await this.eventBus.publish(TEMPLATE_EVENTS.CREATED, {
      templateId: result.value.id,
      authorId,
      name: input.name,
      timestamp: new Date(),
    });

    return ok(result.value);
  }

  async getById(id: string): Promise<Result<Template, AppError>> {
    return this.templateRepository.findById(id);
  }

  async getBySlug(slug: string): Promise<Result<Template, AppError>> {
    return this.templateRepository.findBySlug(slug);
  }

  async update(
    id: string,
    input: UpdateTemplateInput,
    userId: string,
  ): Promise<Result<Template, AppError>> {
    const existing = await this.templateRepository.findById(id);
    if (existing.isErr()) return err(existing.error);

    if (existing.value.authorId !== userId) {
      return err(new AppError('template-management.unauthorized'));
    }

    if (existing.value.status !== TemplateStatus.DRAFT) {
      return err(new AppError('template-management.edit_only_in_draft'));
    }

    const data: Record<string, unknown> = {};
    if (input.name !== undefined) data['name'] = input.name;
    if (input.description !== undefined) data['description'] = input.description;
    if (input.categoryId !== undefined) data['categoryId'] = input.categoryId;
    if (input.language !== undefined) data['language'] = input.language;
    if (input.content !== undefined)
      data['content'] = input.content as unknown as Record<string, unknown>;

    if (input.name !== undefined) {
      data['slug'] = this.generateSlug(input.name);
    }

    return this.templateRepository.update(id, data);
  }

  async softDelete(id: string, userId: string): Promise<Result<void, AppError>> {
    const existing = await this.templateRepository.findById(id);
    if (existing.isErr()) return err(existing.error);

    if (existing.value.authorId !== userId) {
      return err(new AppError('template-management.unauthorized'));
    }

    const result = await this.templateRepository.softDelete(id, userId);
    if (result.isErr()) return err(result.error);

    await this.eventBus.publish(TEMPLATE_EVENTS.DELETED, {
      templateId: id,
      deletedBy: userId,
      timestamp: new Date(),
    });

    return ok(undefined);
  }

  async listByAuthor(
    authorId: string,
    page: number = 0,
    pageSize: number = 10,
  ): Promise<Result<TemplateSearchResult, AppError>> {
    return this.templateRepository.findByAuthor(authorId, page, pageSize);
  }

  async search(params: TemplateSearchParams): Promise<Result<TemplateSearchResult, AppError>> {
    return this.templateRepository.search(params);
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
