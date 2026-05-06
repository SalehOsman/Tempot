export const DOCUMENT_ENGINE_ERRORS = {
  UNSUPPORTED_FORMAT: 'document_engine.unsupported_format',
  GENERATION_FAILED: 'document_engine.generation_failed',
  STORAGE_UPLOAD_FAILED: 'document_engine.storage_upload_failed',
  QUEUE_ENQUEUE_FAILED: 'document_engine.queue_enqueue_failed',
  EVENT_PUBLISH_FAILED: 'document_engine.event_publish_failed',
} as const;

export type DocumentEngineErrorCode =
  (typeof DOCUMENT_ENGINE_ERRORS)[keyof typeof DOCUMENT_ENGINE_ERRORS];
