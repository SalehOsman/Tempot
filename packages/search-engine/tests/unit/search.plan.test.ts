import { describe, expect, it } from 'vitest';
import { SEARCH_ENGINE_ERRORS, SearchPlanBuilder } from '../../src/index.js';
import type { SearchFilterDefinition, SearchRequest } from '../../src/index.js';

const allowedFields: readonly SearchFilterDefinition[] = [
  { field: 'status', kind: 'enum', operators: ['equals', 'in'] },
  { field: 'amount', kind: 'range', operators: ['between', 'gte', 'lte'] },
  { field: 'createdAt', kind: 'date-range', operators: ['between', 'gte', 'lte'] },
  { field: 'customerName', kind: 'contains', operators: ['contains'] },
  { field: 'isArchived', kind: 'boolean', operators: ['equals'] },
];

function createRequest(overrides: Partial<SearchRequest> = {}): SearchRequest {
  return {
    requestId: 'search-1',
    mode: 'exact',
    query: 'invoice',
    filters: [
      { field: 'status', kind: 'enum', operator: 'equals', value: { value: 'paid' } },
      { field: 'amount', kind: 'range', operator: 'gte', value: { min: 100 } },
      {
        field: 'createdAt',
        kind: 'date-range',
        operator: 'between',
        value: { from: '2026-01-01T00:00:00.000Z', to: '2026-01-31T00:00:00.000Z' },
      },
      { field: 'customerName', kind: 'contains', operator: 'contains', value: { query: 'saleh' } },
      { field: 'isArchived', kind: 'boolean', operator: 'equals', value: { value: false } },
    ],
    sort: [{ field: 'createdAt', direction: 'desc' }],
    pagination: { page: 2, pageSize: 25 },
    allowedFields,
    ...overrides,
  };
}

describe('SearchPlanBuilder', () => {
  it('should build normalized relational plans without executing persistence', async () => {
    const result = await new SearchPlanBuilder().build(createRequest());

    expect(result.isOk()).toBe(true);
    if (result.isErr()) return;
    expect(result.value).toEqual({
      requestId: 'search-1',
      mode: 'exact',
      criteria: {
        query: 'invoice',
        filters: createRequest().filters,
        sort: [{ field: 'createdAt', direction: 'desc' }],
      },
      pagination: {
        page: 2,
        pageSize: 25,
        offset: 25,
        limit: 25,
        totalItems: 0,
      },
      messageKeys: [],
    });
  });

  it('should reject unsupported fields before producing a search plan', async () => {
    const result = await new SearchPlanBuilder().build(
      createRequest({
        filters: [
          {
            field: 'privateNote',
            kind: 'contains',
            operator: 'contains',
            value: { query: 'secret' },
          },
        ],
      }),
    );

    expect(result.isErr()).toBe(true);
    if (result.isOk()) return;
    expect(result.error.code).toBe(SEARCH_ENGINE_ERRORS.UNSUPPORTED_FIELD);
  });

  it('should reject unsupported sort fields before producing a search plan', async () => {
    const result = await new SearchPlanBuilder().build(
      createRequest({
        sort: [{ field: 'privateNote', direction: 'asc' }],
      }),
    );

    expect(result.isErr()).toBe(true);
    if (result.isOk()) return;
    expect(result.error.code).toBe(SEARCH_ENGINE_ERRORS.UNSUPPORTED_FIELD);
  });

  it('should reject operators that are not allowed by the field definition', async () => {
    const result = await new SearchPlanBuilder().build(
      createRequest({
        filters: [
          { field: 'status', kind: 'enum', operator: 'contains', value: { query: 'paid' } },
        ],
      }),
    );

    expect(result.isErr()).toBe(true);
    if (result.isOk()) return;
    expect(result.error.code).toBe(SEARCH_ENGINE_ERRORS.INVALID_OPERATOR);
  });
});
