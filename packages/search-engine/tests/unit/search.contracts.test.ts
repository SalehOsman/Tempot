import { describe, expect, it } from 'vitest';
import {
  SEARCH_ENGINE_MESSAGE_KEYS,
  buildPaginationPlan,
  createEmptySearchResultPage,
} from '../../src/index.js';
import type {
  SearchFilter,
  SearchFilterDefinition,
  SearchRequest,
  SearchResultPage,
} from '../../src/index.js';

const filterDefinitions: readonly SearchFilterDefinition[] = [
  { field: 'status', kind: 'enum', operators: ['equals', 'in'] },
  { field: 'amount', kind: 'range', operators: ['between', 'gte', 'lte'] },
  { field: 'createdAt', kind: 'date-range', operators: ['between', 'gte', 'lte'] },
  { field: 'customerName', kind: 'contains', operators: ['contains'] },
  { field: 'isArchived', kind: 'boolean', operators: ['equals'] },
];

describe('SearchEngineContracts', () => {
  it('should type all required filter categories without persistence execution details', () => {
    const filters: readonly SearchFilter[] = [
      { field: 'status', kind: 'enum', operator: 'in', value: { values: ['paid', 'pending'] } },
      { field: 'amount', kind: 'range', operator: 'between', value: { min: 10, max: 50 } },
      {
        field: 'createdAt',
        kind: 'date-range',
        operator: 'between',
        value: { from: '2026-01-01T00:00:00.000Z', to: '2026-01-31T00:00:00.000Z' },
      },
      { field: 'customerName', kind: 'contains', operator: 'contains', value: { query: 'saleh' } },
      { field: 'isArchived', kind: 'boolean', operator: 'equals', value: { value: false } },
    ];
    const request: SearchRequest = {
      requestId: 'search-1',
      mode: 'exact',
      query: 'invoice',
      filters,
      sort: [{ field: 'createdAt', direction: 'desc' }],
      pagination: { page: 2, pageSize: 25 },
      allowedFields: filterDefinitions,
    };

    expect(request.filters).toHaveLength(5);
    expect(request.allowedFields.map((definition) => definition.kind)).toEqual([
      'enum',
      'range',
      'date-range',
      'contains',
      'boolean',
    ]);
  });

  it('should expose pagination metadata for message-edit list flows', () => {
    expect(buildPaginationPlan({ page: 3, pageSize: 20 })).toEqual({
      page: 3,
      pageSize: 20,
      offset: 40,
      limit: 20,
      totalItems: 0,
    });
  });

  it('should create empty result pages with i18n message keys', () => {
    const page: SearchResultPage<{ id: string }> = createEmptySearchResultPage({
      page: 1,
      pageSize: 10,
    });

    expect(page).toEqual({
      items: [],
      totalItems: 0,
      page: 1,
      pageSize: 10,
      messageKey: SEARCH_ENGINE_MESSAGE_KEYS.EMPTY_RESULTS,
    });
  });
});
