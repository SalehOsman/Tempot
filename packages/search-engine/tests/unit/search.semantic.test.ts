import { describe, expect, it } from 'vitest';
import { ok } from 'neverthrow';
import { SEARCH_ENGINE_ERRORS, SearchPlanBuilder } from '../../src/index.js';
import type {
  SearchPlanBuilderDeps,
  SearchRequest,
  SemanticSearchPlanInput,
  SemanticSearchMetadata,
} from '../../src/index.js';

function createSemanticRequest(query = 'late invoices'): SearchRequest {
  return {
    requestId: 'semantic-1',
    mode: 'semantic',
    query,
    filters: [],
    sort: [],
    pagination: { page: 1, pageSize: 5 },
    allowedFields: [],
  };
}

class FakeSemanticPlanner {
  readonly calls: SemanticSearchPlanInput[] = [];

  async plan(input: SemanticSearchPlanInput) {
    this.calls.push(input);
    const metadata: SemanticSearchMetadata = {
      query: input.query,
      relevanceThreshold: 0.72,
      resultLimit: input.request.pagination.pageSize,
    };
    return ok(metadata);
  }
}

describe('SearchSemanticPlanning', () => {
  it('should delegate semantic planning through an injected adapter', async () => {
    const semantic = new FakeSemanticPlanner();
    const deps: SearchPlanBuilderDeps = { semantic };
    const result = await new SearchPlanBuilder(deps).build(createSemanticRequest());

    expect(result.isOk()).toBe(true);
    expect(semantic.calls).toHaveLength(1);
    expect(semantic.calls[0]?.query).toBe('late invoices');
    if (result.isErr()) return;
    expect(result.value.semantic).toEqual({
      query: 'late invoices',
      relevanceThreshold: 0.72,
      resultLimit: 5,
    });
  });

  it('should reject semantic search when the query is empty', async () => {
    const result = await new SearchPlanBuilder({ semantic: new FakeSemanticPlanner() }).build(
      createSemanticRequest('   '),
    );

    expect(result.isErr()).toBe(true);
    if (result.isOk()) return;
    expect(result.error.code).toBe(SEARCH_ENGINE_ERRORS.INVALID_SEMANTIC_QUERY);
  });
});
