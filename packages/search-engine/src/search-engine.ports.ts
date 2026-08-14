import type { AsyncResult } from '@tempot/shared';
import type { SearchRequest, SemanticSearchMetadata } from './search-engine.types.js';

export interface SearchCachePort {
  readonly set: (key: string, value: string, ttlSeconds: number) => AsyncResult<void>;
  readonly get: (key: string) => AsyncResult<string | undefined>;
}

export interface SemanticSearchPlanInput {
  readonly request: SearchRequest;
  readonly query: string;
}

export interface SemanticSearchPlannerPort {
  readonly plan: (input: SemanticSearchPlanInput) => AsyncResult<SemanticSearchMetadata>;
}

export interface SearchPlanBuilderDeps {
  readonly semantic?: SemanticSearchPlannerPort;
}
