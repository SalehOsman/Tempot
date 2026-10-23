/**
 * Security & PII Redaction Paths for Pino Logger:
 * Automatically censors sensitive credentials, tokens, passwords, and PII in application logs.
 */
export const SENSITIVE_REDACTION_PATHS: readonly string[] = [
  'req.headers.authorization',
  'req.headers.cookie',
  'req.headers["x-telegram-bot-api-secret-token"]',
  'headers.authorization',
  'token',
  '*.token',
  'password',
  '*.password',
  'secret',
  '*.secret',
  'initData',
  '*.initData',
  'botToken',
  '*.botToken',
  'apiKey',
  '*.apiKey',
  'creditCard',
  '*.creditCard',
  'cardNumber',
  '*.cardNumber',
  'cvv',
  '*.cvv',
];

/**
 * In-line string masking utility for sensitive data patterns (e.g. phone numbers or tokens).
 */
export function maskSensitiveString(input: string): string {
  if (!input) return input;
  // Masks 10+ digit numbers (phone/card) except last 4 digits
  return input.replace(/\b(\d{3,6})\d{4,8}(\d{4})\b/g, '$1****$2');
}
