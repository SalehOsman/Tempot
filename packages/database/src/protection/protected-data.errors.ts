export const PROTECTED_DATA_ERRORS = {
  INVALID_KEY: 'database.protection.invalid_key',
  UNKNOWN_KEY_VERSION: 'database.protection.unknown_key_version',
  INVALID_PAYLOAD: 'database.protection.invalid_payload',
  PROTECT_FAILED: 'database.protection.protect_failed',
  INTEGRITY_FAILED: 'database.protection.integrity_failed',
  INVALID_LOOKUP_VALUE: 'database.protection.invalid_lookup_value',
  LOOKUP_FIELD_UNSUPPORTED: 'database.protection.lookup_field_unsupported',
  NOT_CONFIGURED: 'database.protection.not_configured',
} as const;
