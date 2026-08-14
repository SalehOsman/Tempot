import pino from 'pino';
import { appErrorSerializer } from './error.serializer.js';
import { SENSITIVE_KEYS } from '../logger.config.js';
import { sessionContext } from '@tempot/shared';

const DEFAULT_LOG_LEVEL = 'info';

/**
 * Main technical logger instance.
 * Configured with Rule XXIII (Serializer), Rule LVII (Audit), and PII redaction.
 */
export const logger = pino({
  level: process.env.LOG_LEVEL || DEFAULT_LOG_LEVEL,
  redact: SENSITIVE_KEYS,
  serializers: {
    err: appErrorSerializer,
  },
  mixin: () => {
    const store = sessionContext.getStore();
    return store ? { userId: store.userId } : {};
  },
});
