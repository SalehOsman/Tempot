export const CMS_ENGINE_ERRORS = {
  AI_REVIEWER_MISSING: 'cms-engine.ai_reviewer_missing',
  AI_REVIEW_FAILED: 'cms-engine.ai_review_failed',
  AUDIT_FAILED: 'cms-engine.audit_failed',
  CACHE_INVALIDATION_FAILED: 'cms-engine.cache_invalidation_failed',
  CACHE_READ_FAILED: 'cms-engine.cache_read_failed',
  CACHE_WRITE_FAILED: 'cms-engine.cache_write_failed',
  DISABLED: 'cms-engine.disabled',
  EVENT_PUBLISH_FAILED: 'cms-engine.event_publish_failed',
  MISSING_KEY: 'cms-engine.missing_key',
  OVERRIDE_READ_FAILED: 'cms-engine.override_read_failed',
  OVERRIDE_WRITE_FAILED: 'cms-engine.override_write_failed',
  PLACEHOLDER_MISMATCH: 'cms-engine.placeholder_mismatch',
  PROTECTED_KEY: 'cms-engine.protected_key',
  ROLLBACK_UNAVAILABLE: 'cms-engine.rollback_unavailable',
  STATIC_READ_FAILED: 'cms-engine.static_read_failed',
} as const;

export const CMS_ENGINE_MESSAGE_KEYS = {
  DISABLED: 'cms_engine.dynamic.disabled',
  MISSING_KEY: 'cms_engine.translation.missing_key',
  REVIEW_UNAVAILABLE: 'cms_engine.ai.review_unavailable',
} as const;
