export type ProtectedDataCategory = 'email' | 'nationalId' | 'mobileNumber' | 'birthDate';

export const SENSITIVE_KEY_ALIASES = [
  'password',
  'token',
  'secret',
  'apiKey',
  'creditCard',
  'email',
  'emailAddress',
  'nationalId',
  'national_id',
  'mobileNumber',
  'mobile_number',
  'phone',
  'phoneNumber',
  'birthDate',
  'birth_date',
  'dateOfBirth',
  'dob',
] as const;

const categoryPrefixes: ReadonlyArray<readonly [ProtectedDataCategory, readonly string[]]> = [
  ['email', ['email']],
  ['nationalId', ['nationalid']],
  ['mobileNumber', ['mobilenumber', 'phone', 'phonenumber']],
  ['birthDate', ['birthdate', 'dateofbirth', 'dob']],
];

const credentialKeys = new Set(['password', 'token', 'secret', 'apikey', 'creditcard']);
const REDACTED = '[REDACTED]';

export function getProtectedDataCategory(key: string): ProtectedDataCategory | null {
  const normalized = normalizeKey(key);
  for (const [category, prefixes] of categoryPrefixes) {
    if (prefixes.some((prefix) => normalized === prefix || normalized.startsWith(prefix))) {
      return category;
    }
  }
  return null;
}

export function isSensitiveDataKey(key: string): boolean {
  return credentialKeys.has(normalizeKey(key)) || getProtectedDataCategory(key) !== null;
}

export function redactSensitiveData(value: unknown): unknown {
  if (typeof value === 'string') return redactString(value);
  if (value === null || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map(redactSensitiveData);
  if (Object.prototype.toString.call(value) !== '[object Object]') return value;

  const redacted: Record<string, unknown> = {};
  for (const [key, nestedValue] of Object.entries(value as Record<string, unknown>)) {
    redacted[key] = isSensitiveDataKey(key) ? REDACTED : redactSensitiveData(nestedValue);
  }
  return redacted;
}

export function omitSensitiveData(value: unknown): unknown {
  if (value === null || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map(omitSensitiveData);
  if (Object.prototype.toString.call(value) !== '[object Object]') return value;

  const safe: Record<string, unknown> = {};
  for (const [key, nestedValue] of Object.entries(value as Record<string, unknown>)) {
    if (!isSensitiveDataKey(key)) safe[key] = omitSensitiveData(nestedValue);
  }
  return safe;
}

function normalizeKey(key: string): string {
  return key.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
}

function redactString(value: string): string {
  const structured = parseStructuredString(value);
  if (structured !== null) return JSON.stringify(redactSensitiveData(structured));

  return value
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, REDACTED)
    .replace(/\b\d{14}\b/g, REDACTED)
    .replace(/\+?\d[\d\s()-]{8,}\d/g, REDACTED)
    .replace(/\b\d{4}-\d{2}-\d{2}\b/g, REDACTED);
}

function parseStructuredString(value: string): unknown | null {
  const trimmed = value.trim();
  if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) return null;
  try {
    return JSON.parse(trimmed) as unknown;
  } catch {
    return null;
  }
}
