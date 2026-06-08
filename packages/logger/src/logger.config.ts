import { SENSITIVE_KEY_ALIASES } from '@tempot/shared';

const MAX_REDACTION_DEPTH = 5;

export const SENSITIVE_KEYS = SENSITIVE_KEY_ALIASES.flatMap((key) =>
  Array.from({ length: MAX_REDACTION_DEPTH + 1 }, (_, depth) => `${'*.'.repeat(depth)}${key}`),
);
