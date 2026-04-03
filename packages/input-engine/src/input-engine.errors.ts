/** Hierarchical error codes for input-engine module (Rule XXII) */
export const INPUT_ENGINE_ERRORS = {
  // Package-level
  DISABLED: 'input-engine.disabled',

  // Schema errors
  SCHEMA_INVALID: 'input-engine.schema.invalid',
  SCHEMA_CIRCULAR_DEPENDENCY: 'input-engine.schema.circular_dependency',

  // Form lifecycle errors
  FORM_CANCELLED: 'input-engine.form.cancelled',
  FORM_TIMEOUT: 'input-engine.form.timeout',
  FORM_ALREADY_ACTIVE: 'input-engine.form.already_active',

  // Field errors
  FIELD_VALIDATION_FAILED: 'input-engine.field.validation_failed',
  FIELD_MAX_RETRIES: 'input-engine.field.max_retries',
  FIELD_PARSE_FAILED: 'input-engine.field.parse_failed',
  FIELD_RENDER_FAILED: 'input-engine.field.render_failed',
  FIELD_TYPE_UNKNOWN: 'input-engine.field.type_unknown',

  // Partial save errors
  PARTIAL_SAVE_FAILED: 'input-engine.partial_save.failed',
  PARTIAL_SAVE_RESTORE_FAILED: 'input-engine.partial_save.restore_failed',

  // Media errors
  MEDIA_SIZE_EXCEEDED: 'input-engine.media.size_exceeded',
  MEDIA_TYPE_NOT_ALLOWED: 'input-engine.media.type_not_allowed',
  MEDIA_UPLOAD_FAILED: 'input-engine.media.upload_failed',
  MEDIA_DURATION_EXCEEDED: 'input-engine.media.duration_exceeded',

  // AI extraction errors
  AI_EXTRACTION_FAILED: 'input-engine.ai.extraction_failed',
  AI_UNAVAILABLE: 'input-engine.ai.unavailable',

  // Geo errors
  GEO_LOAD_FAILED: 'input-engine.geo.load_failed',

  // IBAN errors
  IBAN_INVALID_CHECKSUM: 'input-engine.iban.invalid_checksum',
  IBAN_COUNTRY_NOT_ALLOWED: 'input-engine.iban.country_not_allowed',

  // QR errors
  QR_DECODE_FAILED: 'input-engine.qr.decode_failed',
  QR_FORMAT_MISMATCH: 'input-engine.qr.format_mismatch',

  // Schedule errors
  SCHEDULE_NO_SLOTS: 'input-engine.schedule.no_slots',
  SCHEDULE_SLOT_UNAVAILABLE: 'input-engine.schedule.slot_unavailable',

  // NationalID errors
  NATIONAL_ID_CHECKSUM_FAILED: 'input-engine.national_id.checksum_failed',
  NATIONAL_ID_FUTURE_DATE: 'input-engine.national_id.future_date',

  // Tags errors
  TAGS_DUPLICATE: 'input-engine.tags.duplicate',
  TAGS_MAX_LENGTH: 'input-engine.tags.max_length',

  // Contact errors
  CONTACT_NOT_SHARED: 'input-engine.contact.not_shared',

  // Event emission (warning-level, not returned to callers)
  EVENT_PUBLISH_FAILED: 'input-engine.event.publish_failed',
} as const;
