import type { FieldMetadata } from '../input-engine.types.js';

/** Actions available in the confirmation step */
export const CONFIRMATION_ACTIONS = {
  CONFIRM: '__confirm__',
  EDIT: '__edit__',
  CANCEL: '__cancel__',
} as const;

/** Translation function type */
type TranslateFunction = (key: string, params?: Record<string, unknown>) => string;

/** Default translate — returns raw key */
function defaultT(key: string): string {
  return key;
}

const MAX_VALUE_LENGTH = 100;

/** Media field types that show "file uploaded" instead of raw value */
const MEDIA_FIELD_TYPES = new Set(['Photo', 'Document', 'Video', 'Audio', 'FileGroup', 'Contact']);

/** Truncate text to MAX_VALUE_LENGTH characters with ellipsis */
function truncate(text: string): string {
  if (text.length <= MAX_VALUE_LENGTH) return text;
  return text.slice(0, MAX_VALUE_LENGTH) + '...';
}

/** Format a single field value for display in the confirmation summary */
export function formatFieldValue(
  value: unknown,
  metadata: FieldMetadata,
  t: TranslateFunction = defaultT,
): string {
  if (value === undefined || value === null) return '—';
  if (typeof value === 'boolean') return value ? '✓' : '✗';

  if (MEDIA_FIELD_TYPES.has(metadata.fieldType)) {
    return t('input-engine.confirmation.file_uploaded');
  }

  if (metadata.options && typeof value === 'string') {
    const option = metadata.options.find((o) => o.value === value);
    if (option) return truncate(option.label);
  }

  return truncate(String(value));
}

/** Build multi-line confirmation summary from form data */
export function buildConfirmationSummary(
  formData: Record<string, unknown>,
  fieldMetadata: Map<string, FieldMetadata>,
  t: TranslateFunction = defaultT,
): string {
  const lines: string[] = [t('input-engine.confirmation.title'), ''];

  for (const [fieldName, value] of Object.entries(formData)) {
    const metadata = fieldMetadata.get(fieldName);
    if (!metadata) continue;
    const label = t(metadata.i18nKey);
    const formatted = formatFieldValue(value, metadata, t);
    lines.push(`${label}: ${formatted}`);
  }

  return lines.join('\n');
}
