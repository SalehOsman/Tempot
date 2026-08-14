/**
 * Error Reference Code Generator — Rule XXIV
 *
 * Generates unique reference codes in the format ERR-YYYYMMDD-XXXX
 * that link user-facing messages, audit log entries, and Sentry events.
 */

const ALPHANUMERIC_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const SUFFIX_LENGTH = 4;
const ERROR_REFERENCE_REGEX = /^ERR-\d{8}-[A-Z0-9]{4}$/;
const MAX_RECENT_CODES = 1000;

/** Tracks recently generated codes to prevent in-process duplicates. */
const recentCodes = new Set<string>();

/**
 * Formats a Date as YYYYMMDD string.
 */
function formatDateStamp(date: Date): string {
  const year = date.getFullYear().toString();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}${month}${day}`;
}

/**
 * Generates a random alphanumeric suffix of fixed length.
 */
function generateSuffix(): string {
  let suffix = '';
  for (let i = 0; i < SUFFIX_LENGTH; i++) {
    const index = Math.floor(Math.random() * ALPHANUMERIC_CHARS.length);
    suffix += ALPHANUMERIC_CHARS[index];
  }
  return suffix;
}

/**
 * Generates a unique error reference code: ERR-YYYYMMDD-XXXX.
 *
 * Rule XXIV: Every system error gets a unique reference code
 * linking user-facing message ↔ Audit Log entry ↔ Sentry event.
 * Uses an in-process deduplication set to prevent collisions.
 */
export function generateErrorReference(): string {
  const dateStamp = formatDateStamp(new Date());

  let code: string;
  do {
    code = `ERR-${dateStamp}-${generateSuffix()}`;
  } while (recentCodes.has(code));

  if (recentCodes.size >= MAX_RECENT_CODES) {
    recentCodes.clear();
  }
  recentCodes.add(code);

  return code;
}

/**
 * Validates whether a string matches the ERR-YYYYMMDD-XXXX format.
 */
export function isValidErrorReference(code: string): boolean {
  return ERROR_REFERENCE_REGEX.test(code);
}
