import pino from 'pino';
import { appErrorSerializer } from './serializer';
import { SENSITIVE_KEYS } from '../config';
import { sessionContext } from '@tempot/session-manager';

/**
 * Main technical logger instance.
 * Configured with Rule XXIII (Serializer), Rule LVII (Audit), and PII redaction.
 */
export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  redact: SENSITIVE_KEYS,
  serializers: {
    err: appErrorSerializer,
  },
  mixin: () => {
    const store = sessionContext.getStore();
    return store ? { userId: store.userId } : {};
  },
});
