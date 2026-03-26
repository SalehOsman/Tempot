import { ok, err } from 'neverthrow';
import type { Result } from 'neverthrow';
import { AppError } from '@tempot/shared';
import {
  ARABIC_CHAR_RANGE_START,
  ARABIC_CHAR_RANGE_END,
  ARABIC_SUPPLEMENT_START,
  ARABIC_SUPPLEMENT_END,
  ARABIC_EXTENDED_A_START,
  ARABIC_EXTENDED_A_END,
  CHAR_LIMITS,
  ROW_LIMITS,
} from '../constants.js';
import { UX_ERRORS } from '../errors.js';
import type { KeyboardType, DetectedLanguage } from '../types.js';

function isArabicCodePoint(code: number): boolean {
  return (
    (code >= ARABIC_CHAR_RANGE_START && code <= ARABIC_CHAR_RANGE_END) ||
    (code >= ARABIC_SUPPLEMENT_START && code <= ARABIC_SUPPLEMENT_END) ||
    (code >= ARABIC_EXTENDED_A_START && code <= ARABIC_EXTENDED_A_END)
  );
}

function isAlphabetic(code: number): boolean {
  return (
    (code >= 0x0041 && code <= 0x005a) || // A-Z
    (code >= 0x0061 && code <= 0x007a) || // a-z
    isArabicCodePoint(code)
  );
}

/** Detect language of label text based on first alphabetic character */
export function detectLanguage(text: string): DetectedLanguage {
  for (const char of text) {
    const code = char.codePointAt(0);
    if (code === undefined) continue;
    if (!isAlphabetic(code)) continue;
    if (isArabicCodePoint(code)) return 'ar';
    return 'en';
  }
  return 'en';
}

/** Get character limit for a keyboard type and language */
export function getCharLimit(type: KeyboardType, language: DetectedLanguage): number {
  return CHAR_LIMITS[type][language];
}

/** Get row limit for a keyboard type */
export function getRowLimit(type: KeyboardType): number {
  return ROW_LIMITS[type];
}

/** Strip leading emoji and whitespace, returning only alphabetic content */
function stripLeadingEmoji(text: string): string {
  let i = 0;
  for (const char of text) {
    const code = char.codePointAt(0);
    if (code === undefined) break;
    if (isAlphabetic(code)) break;
    i += char.length;
  }
  return text.slice(i).trim();
}

/** Validate a button label against character limits per language and keyboard type */
export function validateLabel(label: string, type: KeyboardType): Result<void, AppError> {
  if (label.length === 0) {
    return err(new AppError(UX_ERRORS.LABEL_EMPTY));
  }

  const stripped = stripLeadingEmoji(label);
  if (stripped.length === 0) {
    // Emoji-only label is valid
    return ok(undefined);
  }

  const language = detectLanguage(label);
  const limit = getCharLimit(type, language);

  if (stripped.length > limit) {
    return err(
      new AppError(UX_ERRORS.LABEL_TOO_LONG, {
        label,
        length: stripped.length,
        limit,
        language,
        type,
      }),
    );
  }

  return ok(undefined);
}
