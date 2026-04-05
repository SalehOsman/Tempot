/** Settings error codes — hierarchical per Rule XXII */
export const SETTINGS_ERRORS = {
  STATIC_MISSING_VARIABLE: 'settings.static.missing_variable',
  STATIC_INVALID_FORMAT: 'settings.static.invalid_format',
  STATIC_VALIDATION_FAILED: 'settings.static.validation_failed',
  DYNAMIC_NOT_FOUND: 'settings.dynamic.not_found',
  DYNAMIC_UNKNOWN_KEY: 'settings.dynamic.unknown_key',
  DYNAMIC_UPDATE_FAILED: 'settings.dynamic.update_failed',
  DYNAMIC_DELETE_FAILED: 'settings.dynamic.delete_failed',
  DYNAMIC_CREATE_FAILED: 'settings.dynamic.create_failed',
  CACHE_READ_FAILED: 'settings.cache.read_failed',
  CACHE_INVALIDATION_FAILED: 'settings.cache.invalidation_failed',
  REPOSITORY_ERROR: 'settings.repository.error',
} as const;
