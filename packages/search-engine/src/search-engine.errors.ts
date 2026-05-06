export const SEARCH_ENGINE_ERRORS = {
  INVALID_OPERATOR: 'search_engine.invalid_operator',
  INVALID_SEMANTIC_QUERY: 'search_engine.invalid_semantic_query',
  SEMANTIC_ADAPTER_MISSING: 'search_engine.semantic_adapter_missing',
  STATE_EXPIRED: 'search_engine.state_expired',
  STATE_PERSIST_FAILED: 'search_engine.state_persist_failed',
  STATE_READ_FAILED: 'search_engine.state_read_failed',
  UNSUPPORTED_FIELD: 'search_engine.unsupported_field',
} as const;

export const SEARCH_ENGINE_MESSAGE_KEYS = {
  EMPTY_RESULTS: 'search_engine.results.empty',
  STATE_EXPIRED: 'search_engine.state.expired',
} as const;
