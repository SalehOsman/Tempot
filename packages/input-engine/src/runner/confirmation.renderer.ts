import type { FieldMetadata, TranslateFunction } from '../input-engine.types.js';
import { defaultT } from '../input-engine.types.js';

/** Actions available in the confirmation step */
export const CONFIRMATION_ACTIONS = {
  CONFIRM: '__confirm__',
  EDIT: '__edit__',
  CANCEL: '__cancel__',
} as const;

const MAX_VALUE_LENGTH = 100;

/** Telegram's maximum message length per D26 */
export const TELEGRAM_MAX_MESSAGE_LENGTH = 4096;

/** Media field types that show "file uploaded" instead of raw value */
const MEDIA_FIELD_TYPES = new Set(['Photo', 'Document', 'Video', 'Audio', 'FileGroup', 'Contact']);

/** Truncate text to MAX_VALUE_LENGTH characters with i18n suffix */
function truncate(text: string, t: TranslateFunction): string {
  if (text.length <= MAX_VALUE_LENGTH) return text;
  return text.slice(0, MAX_VALUE_LENGTH) + t('input-engine.confirmation.truncated_suffix');
}

/** Format a single field value for display in the confirmation summary */
export function formatFieldValue(
  value: unknown,
  metadata: FieldMetadata,
  t: TranslateFunction = defaultT,
): string {
  if (value === undefined || value === null) return t('input-engine.confirmation.empty_value');
  if (typeof value === 'boolean') {
    return value
      ? t('input-engine.confirmation.boolean_true')
      : t('input-engine.confirmation.boolean_false');
  }

  if (MEDIA_FIELD_TYPES.has(metadata.fieldType)) {
    return t('input-engine.confirmation.file_uploaded');
  }

  if (metadata.options && typeof value === 'string') {
    const option = metadata.options.find((o) => o.value === value);
    if (option) return truncate(option.label, t);
  }

  return truncate(String(value), t);
}

/** Split lines into chunks that fit within Telegram's message limit */
function splitIntoChunks(lines: string[]): string[] {
  const chunks: string[] = [];
  let current = '';

  for (const line of lines) {
    const candidate = current ? current + '\n' + line : line;
    if (candidate.length > TELEGRAM_MAX_MESSAGE_LENGTH && current) {
      chunks.push(current);
      current = line;
    } else {
      current = candidate;
    }
  }

  if (current) chunks.push(current);
  return chunks.length > 0 ? chunks : [''];
}

/** Build multi-line confirmation summary from form data, split into chunks ≤ 4096 chars */
export function buildConfirmationSummary(
  formData: Record<string, unknown>,
  fieldMetadata: Map<string, FieldMetadata>,
  t: TranslateFunction = defaultT,
): string[] {
  const lines: string[] = [t('input-engine.confirmation.title'), ''];

  for (const [fieldName, value] of Object.entries(formData)) {
    const metadata = fieldMetadata.get(fieldName);
    if (!metadata) continue;
    const label = t(metadata.i18nKey);
    const formatted = formatFieldValue(value, metadata, t);
    lines.push(`${label}: ${formatted}`);
  }

  return splitIntoChunks(lines);
}
