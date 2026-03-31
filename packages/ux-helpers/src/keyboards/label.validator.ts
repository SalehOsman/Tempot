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
} from '../ux.constants.js';
import { UX_ERRORS } from '../ux.errors.js';
import type { KeyboardType, DetectedLanguage } from '../ux.types.js';

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

/** Check if a label is considered "long" for its keyboard type (over half the char limit) */
export function isLongLabel(label: string, type: KeyboardType): boolean {
  const language = detectLanguage(label);
  const limit = getCharLimit(type, language);
  const stripped = stripLeadingEmoji(label);
  return stripped.length > limit / 2;
}

/** Strip leading emoji and whitespace, returning only alphabetic content */
export function stripLeadingEmoji(text: string): string {
  let i = 0;
  for (const char of text) {
    const code = char.codePointAt(0);
    if (code === undefined) break;
    if (isAlphabetic(code)) break;
    i += char.length;
  }
  return text.slice(i).trim();
}

/** Check if the first character of the text is an emoji (non-alphabetic, non-whitespace, non-ASCII punctuation) */
function startsWithEmoji(text: string): boolean {
  for (const char of text) {
    const code = char.codePointAt(0);
    if (code === undefined) return false;
    // Skip whitespace (space, tab, NBSP)
    if (code === 0x20 || code === 0x09 || code === 0xa0) continue;
    // If alphabetic, it's not an emoji start
    if (isAlphabetic(code)) return false;
    // If basic ASCII printable (punctuation, digits), not emoji
    if (code >= 0x21 && code <= 0x7e) return false;
    // Non-ASCII, non-alphabetic = likely emoji or symbol
    return true;
  }
  return false;
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

  // Inline keyboards require emoji at start of button text (Rule LXVI)
  if (type === 'inline' && !startsWithEmoji(label)) {
    return err(new AppError(UX_ERRORS.LABEL_NO_EMOJI, { label }));
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
