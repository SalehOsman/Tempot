import { SENSITIVE_KEY_ALIASES, isSensitiveDataKey, redactSensitiveData } from '@tempot/shared';

const REDACTED = '[Redacted]';

export const SENSITIVE_KEYS = {
  paths: ['*', ...SENSITIVE_KEY_ALIASES],
  censor: (value: unknown, path: string[]): unknown => {
    const key = path.at(-1);
    return typeof key === 'string' && isSensitiveDataKey(key)
      ? REDACTED
      : redactSensitiveData(value);
  },
};
