import { AppError } from '@tempot/shared';
import { type Result } from 'neverthrow';
import type {
  TemplateSearchParams,
  TemplateSearchResult,
  TemplateSortField,
} from '../types/template.types.js';
import { TemplateStatus } from '../types/template.types.js';
import type { TemplateRepository } from '../repositories/template.repository.js';

export interface SearchInput {
  query?: string;
  categoryId?: string;
  tags?: string[];
  sort?: TemplateSortField;
  page?: number;
  pageSize?: number;
}

export interface BrowseInput {
  categoryId?: string;
  sort?: TemplateSortField;
  page?: number;
  pageSize?: number;
}

export class SearchService {
  constructor(private readonly templateRepository: TemplateRepository) {}

  async search(input: SearchInput): Promise<Result<TemplateSearchResult, AppError>> {
    const params: TemplateSearchParams = {
      filters: {
        query: input.query,
        categoryId: input.categoryId,
        tags: input.tags,
        status: TemplateStatus.PUBLISHED,
      },
      sort: input.sort ?? 'relevance',
      page: input.page ?? 0,
      pageSize: input.pageSize ?? 10,
    };

    return this.templateRepository.search(params);
  }

  async browse(input: BrowseInput = {}): Promise<Result<TemplateSearchResult, AppError>> {
    const params: TemplateSearchParams = {
      filters: {
        categoryId: input.categoryId,
        status: TemplateStatus.PUBLISHED,
      },
      sort: input.sort ?? 'rating',
      page: input.page ?? 0,
      pageSize: input.pageSize ?? 10,
    };

    return this.templateRepository.search(params);
  }
}
