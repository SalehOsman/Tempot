export type SearchMode = 'exact' | 'semantic';

export type SearchFilterKind = 'boolean' | 'contains' | 'date-range' | 'enum' | 'range';

export type SearchFilterOperator = 'between' | 'contains' | 'equals' | 'gte' | 'in' | 'lte';

export interface EnumFilterValue {
  readonly value?: string;
  readonly values?: readonly string[];
}

export interface RangeFilterValue {
  readonly min?: number;
  readonly max?: number;
}

export interface DateRangeFilterValue {
  readonly from?: string;
  readonly to?: string;
}

export interface ContainsFilterValue {
  readonly query: string;
}

export interface BooleanFilterValue {
  readonly value: boolean;
}

export type SearchFilterValue =
  | BooleanFilterValue
  | ContainsFilterValue
  | DateRangeFilterValue
  | EnumFilterValue
  | RangeFilterValue;

export interface SearchFilterDefinition {
  readonly field: string;
  readonly kind: SearchFilterKind;
  readonly operators: readonly SearchFilterOperator[];
}

export interface SearchFilter {
  readonly field: string;
  readonly kind: SearchFilterKind;
  readonly operator: SearchFilterOperator;
  readonly value: SearchFilterValue;
}

export interface SortRule {
  readonly field: string;
  readonly direction: 'asc' | 'desc';
}

export interface PaginationRequest {
  readonly page: number;
  readonly pageSize: number;
}

export interface PaginationPlan extends PaginationRequest {
  readonly offset: number;
  readonly limit: number;
  readonly totalItems: number;
}

export interface SearchRequest {
  readonly requestId: string;
  readonly mode: SearchMode;
  readonly query?: string;
  readonly filters: readonly SearchFilter[];
  readonly sort: readonly SortRule[];
  readonly pagination: PaginationRequest;
  readonly allowedFields: readonly SearchFilterDefinition[];
}

export interface SearchCriteria {
  readonly query?: string;
  readonly filters: readonly SearchFilter[];
  readonly sort: readonly SortRule[];
}

export interface SemanticSearchMetadata {
  readonly query: string;
  readonly relevanceThreshold?: number;
  readonly resultLimit?: number;
}

export interface SearchPlan {
  readonly requestId: string;
  readonly mode: SearchMode;
  readonly criteria: SearchCriteria;
  readonly pagination: PaginationPlan;
  readonly messageKeys: readonly string[];
  readonly semantic?: SemanticSearchMetadata;
}

export interface SearchStateSnapshot {
  readonly stateId: string;
  readonly ownerId: string;
  readonly request: SearchRequest;
  readonly expiresInSeconds: number;
}

export interface SearchResultPage<TItem> extends PaginationRequest {
  readonly items: readonly TItem[];
  readonly totalItems: number;
  readonly messageKey?: string;
}
