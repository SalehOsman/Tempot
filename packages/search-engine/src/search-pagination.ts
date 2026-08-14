import { SEARCH_ENGINE_MESSAGE_KEYS } from './search-engine.errors.js';
import type { PaginationPlan, PaginationRequest, SearchResultPage } from './search-engine.types.js';

export function buildPaginationPlan(request: PaginationRequest): PaginationPlan {
  const page = Math.max(1, request.page);
  const pageSize = Math.max(1, request.pageSize);
  return {
    page,
    pageSize,
    offset: (page - 1) * pageSize,
    limit: pageSize,
    totalItems: 0,
  };
}

export function createEmptySearchResultPage<TItem>(
  request: PaginationRequest,
): SearchResultPage<TItem> {
  return {
    items: [],
    totalItems: 0,
    page: request.page,
    pageSize: request.pageSize,
    messageKey: SEARCH_ENGINE_MESSAGE_KEYS.EMPTY_RESULTS,
  };
}
