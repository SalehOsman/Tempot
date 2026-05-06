export const IMPORT_ENGINE_ERRORS = {
  PARSE_FAILED: 'import_engine.parse_failed',
  VALIDATION_FAILED: 'import_engine.validation_failed',
  UNSUPPORTED_FORMAT: 'import_engine.unsupported_format',
  STORAGE_READ_FAILED: 'import_engine.storage_read_failed',
  QUEUE_ENQUEUE_FAILED: 'import_engine.queue_enqueue_failed',
  EVENT_PUBLISH_FAILED: 'import_engine.event_publish_failed',
  DOCUMENT_REPORT_FAILED: 'import_engine.document_report_failed',
} as const;

export type ImportEngineErrorCode =
  (typeof IMPORT_ENGINE_ERRORS)[keyof typeof IMPORT_ENGINE_ERRORS];
