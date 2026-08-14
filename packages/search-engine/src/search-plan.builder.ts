import { AppError } from '@tempot/shared';
import type { AsyncResult, Result } from '@tempot/shared';
import { err, ok } from 'neverthrow';
import { SEARCH_ENGINE_ERRORS } from './search-engine.errors.js';
import { searchEngineToggle } from './search-engine.toggle.js';
import { buildPaginationPlan } from './search-pagination.js';
import type { SearchPlanBuilderDeps } from './search-engine.ports.js';
import type {
  SearchFilter,
  SearchFilterDefinition,
  SearchPlan,
  SearchRequest,
  SortRule,
} from './search-engine.types.js';

export class SearchPlanBuilder {
  constructor(private readonly deps: SearchPlanBuilderDeps = {}) {}

  async build(request: SearchRequest): AsyncResult<SearchPlan> {
    const disabled = searchEngineToggle.check();
    if (disabled) return disabled;

    const validation = validateRequestFields(request.filters, request.sort, request.allowedFields);
    if (validation.isErr()) return err(validation.error);
    if (request.mode === 'semantic') return this.buildSemantic(request);

    return ok({
      requestId: request.requestId,
      mode: request.mode,
      criteria: {
        query: request.query,
        filters: request.filters,
        sort: request.sort,
      },
      pagination: buildPaginationPlan(request.pagination),
      messageKeys: [],
    });
  }

  private async buildSemantic(request: SearchRequest): AsyncResult<SearchPlan> {
    const query = request.query?.trim();
    if (!query) return err(new AppError(SEARCH_ENGINE_ERRORS.INVALID_SEMANTIC_QUERY));
    if (!this.deps.semantic)
      return err(new AppError(SEARCH_ENGINE_ERRORS.SEMANTIC_ADAPTER_MISSING));

    const semantic = await this.deps.semantic.plan({ request, query });
    if (semantic.isErr()) return err(semantic.error);
    return ok({
      requestId: request.requestId,
      mode: request.mode,
      criteria: {
        query,
        filters: request.filters,
        sort: request.sort,
      },
      pagination: buildPaginationPlan(request.pagination),
      messageKeys: [],
      semantic: semantic.value,
    });
  }
}

function validateRequestFields(
  filters: readonly SearchFilter[],
  sort: readonly SortRule[],
  definitions: readonly SearchFilterDefinition[],
): Result<void> {
  for (const filter of filters) {
    const definition = definitions.find((item) => item.field === filter.field);
    if (!definition || definition.kind !== filter.kind) {
      return err(new AppError(SEARCH_ENGINE_ERRORS.UNSUPPORTED_FIELD, { field: filter.field }));
    }
    if (!definition.operators.includes(filter.operator)) {
      return err(new AppError(SEARCH_ENGINE_ERRORS.INVALID_OPERATOR, { field: filter.field }));
    }
  }
  for (const rule of sort) {
    if (!definitions.some((item) => item.field === rule.field)) {
      return err(new AppError(SEARCH_ENGINE_ERRORS.UNSUPPORTED_FIELD, { field: rule.field }));
    }
  }
  return ok(undefined);
}
