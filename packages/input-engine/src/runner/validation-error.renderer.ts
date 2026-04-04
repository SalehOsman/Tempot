import type { FieldMetadata, FieldType, TranslateFunction } from '../input-engine.types.js';
import { defaultT } from '../input-engine.types.js';

/** Retry state for error context */
export interface RetryState {
  current: number;
  max: number;
}

/** Default i18n error keys per field type */
const DEFAULT_ERROR_KEYS: Partial<Record<FieldType, string>> = {
  ShortText: 'input-engine.errors.short-text',
  LongText: 'input-engine.errors.long-text',
  Email: 'input-engine.errors.email',
  Phone: 'input-engine.errors.phone',
  URL: 'input-engine.errors.url',
  Integer: 'input-engine.errors.integer',
  Float: 'input-engine.errors.float',
  Currency: 'input-engine.errors.currency',
  Photo: 'input-engine.errors.photo',
  Document: 'input-engine.errors.document',
  Video: 'input-engine.errors.video',
  Audio: 'input-engine.errors.audio',
};

const GENERIC_ERROR_KEY = 'input-engine.errors.generic';

/** Render a validation error message with retry context */
export function renderValidationError(
  metadata: FieldMetadata,
  retryState: RetryState,
  t: TranslateFunction = defaultT,
): string {
  const errorKey =
    metadata.i18nErrorKey ?? DEFAULT_ERROR_KEYS[metadata.fieldType] ?? GENERIC_ERROR_KEY;

  return t(errorKey, {
    attempt: retryState.current,
    maxRetries: retryState.max,
  });
}
